import 'dart:convert';
import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'package:maintflow_mobile/data/models/intervention.dart';
import 'package:maintflow_mobile/data/models/machine.dart';

part 'app_database.g.dart';

/// Local offline cache. Entities are stored as their id + raw API JSON, so the
/// cache survives model tweaks and the UI can read fully-typed objects back.
/// This is the source of truth the UI reads first (offline-first).
class CachedInterventions extends Table {
  TextColumn get id => text()();
  TextColumn get data => text()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class CachedMachines extends Table {
  TextColumn get id => text()();
  TextColumn get data => text()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// Pending offline mutations (the sync queue). Each row is a deferred API call
/// that is replayed, in order, when connectivity returns.
class SyncOps extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get method => text()();
  TextColumn get path => text()();
  TextColumn get body => text()();
}

@DriftDatabase(tables: [CachedInterventions, CachedMachines, SyncOps])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_open());

  /// In-memory database for tests.
  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 2) await m.createTable(syncOps);
        },
      );

  // ── Interventions ──────────────────────────────────────────────────────────
  Stream<List<Intervention>> watchInterventions() =>
      select(cachedInterventions).watch().map(
            (rows) => rows
                .map((r) => _decode(r.data, Intervention.fromJson))
                .toList(),
          );

  Future<void> replaceInterventions(List<Intervention> items) =>
      _replace(cachedInterventions, items, (i) => i.id, (i) => i.toJson());

  // ── Machines ───────────────────────────────────────────────────────────────
  Stream<List<Machine>> watchMachines() => select(cachedMachines).watch().map(
        (rows) => rows.map((r) => _decode(r.data, Machine.fromJson)).toList(),
      );

  Future<void> replaceMachines(List<Machine> items) =>
      _replace(cachedMachines, items, (m) => m.id, (m) => m.toJson());

  /// Optimistically update one cached intervention (e.g. after a local edit).
  Future<void> upsertIntervention(Intervention i) {
    return into(cachedInterventions).insertOnConflictUpdate(
      CachedInterventionsCompanion.insert(
        id: i.id,
        data: jsonEncode(i.toJson()),
      ),
    );
  }

  // ── Sync queue ───────────────────────────────────────────────────────────────
  Future<void> enqueueOp(String method, String path, String body) {
    return into(syncOps).insert(
      SyncOpsCompanion.insert(method: method, path: path, body: body),
    );
  }

  Future<List<SyncOp>> pendingOps() =>
      (select(syncOps)..orderBy([(t) => OrderingTerm.asc(t.id)])).get();

  Future<void> deleteOp(int id) =>
      (delete(syncOps)..where((t) => t.id.equals(id))).go();

  Stream<int> watchPendingCount() => syncOps.count().watchSingle();

  // ── Helpers ────────────────────────────────────────────────────────────────
  /// Atomically swap a cache table to exactly [items] (so deletions propagate).
  Future<void> _replace<T extends Table, R extends DataClass, M>(
    TableInfo<T, R> table,
    List<M> items,
    String Function(M) idOf,
    Map<String, dynamic> Function(M) jsonOf,
  ) {
    return transaction(() async {
      await delete(table).go();
      await batch((b) {
        b.insertAll(
          table,
          items.map(
            (m) => RawValuesInsertable<R>(<String, Expression<Object>>{
              'id': Variable<String>(idOf(m)),
              'data': Variable<String>(jsonEncode(jsonOf(m))),
            }),
          ),
        );
      });
    });
  }

  static T _decode<T>(String raw, T Function(Map<String, dynamic>) fromJson) =>
      fromJson(jsonDecode(raw) as Map<String, dynamic>);
}

LazyDatabase _open() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'maintflow.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

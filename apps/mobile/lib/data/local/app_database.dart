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

@DriftDatabase(tables: [CachedInterventions, CachedMachines])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_open());

  /// In-memory database for tests.
  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 1;

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

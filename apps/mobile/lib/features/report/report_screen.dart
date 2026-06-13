import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/data/datasources/api_data_source.dart';
import 'package:maintflow_mobile/data/models/enums.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/data/photos/photo_picker.dart';
import 'package:maintflow_mobile/data/repositories/sync_service.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

/// Wire values for [FaultType], matching `packages/shared` / the Prisma enum.
const _typeWire = {
  FaultType.mecanique: 'mecanique',
  FaultType.electrique: 'electrique',
  FaultType.hydraulique: 'hydraulique',
  FaultType.logiciel: 'logiciel',
};

/// Wire values for [FaultSeverity], matching `packages/shared`.
const _severityWire = {
  FaultSeverity.critical: 'critical',
  FaultSeverity.medium: 'medium',
  FaultSeverity.low: 'low',
};

/// Minimum description length, mirroring the API `CreateFaultDto` (`MinLength(4)`).
const kFaultDescriptionMin = 4;

/// Builds the `POST /faults` request body from the form state. Pure and
/// unit-tested so the enum→wire mapping stays in lock-step with the API DTO.
Map<String, dynamic> buildCreateFaultBody({
  required String machineId,
  required FaultType type,
  required FaultSeverity severity,
  required String description,
}) =>
    {
      'machineId': machineId,
      'type': _typeWire[type],
      'severity': _severityWire[severity],
      'description': description.trim(),
    };

const _typeOptions = <(FaultType type, String label, String sub)>[
  (FaultType.mecanique, 'Mécanique', 'Roulement, joint, transmission'),
  (FaultType.electrique, 'Électrique', 'Disjoncteur, capteur, câblage'),
  (FaultType.hydraulique, 'Hydraulique', 'Fuite, pression, vérin'),
  (FaultType.logiciel, 'Logiciel', 'Automate, IHM, programme'),
];

const _severityOptions = <(FaultSeverity severity, String label)>[
  (FaultSeverity.critical, 'Critique'),
  (FaultSeverity.medium, 'Moyenne'),
  (FaultSeverity.low, 'Faible'),
];

/// "Signaler une panne" — the technician declares a fault on a (usually
/// scanned) machine. Mirrors the prototype `ReportScreen`: fault type, severity,
/// description and an optional photo. Without a photo the fault is created
/// offline-first via [SyncService] (queued, replayed on reconnect). With a photo
/// it goes online — create the fault, then upload to `POST /files/faults/:id`
/// (the upload needs the server id) — and surfaces an error if offline.
class ReportScreen extends ConsumerStatefulWidget {
  const ReportScreen({required this.machineId, super.key});

  final String machineId;

  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  FaultType _type = FaultType.electrique;
  FaultSeverity _severity = FaultSeverity.medium;
  final _description = TextEditingController();
  PickedPhoto? _photo;
  bool _submitting = false;

  Future<void> _pickPhoto() async {
    final photo = await ref.read(photoPickerProvider).capture();
    if (photo != null && mounted) setState(() => _photo = photo);
  }

  @override
  void initState() {
    super.initState();
    _description.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _description.dispose();
    super.dispose();
  }

  bool get _valid => _description.text.trim().length >= kFaultDescriptionMin;

  Future<void> _submit() async {
    if (!_valid || _submitting) return;
    setState(() => _submitting = true);
    final body = buildCreateFaultBody(
      machineId: widget.machineId,
      type: _type,
      severity: _severity,
      description: _description.text,
    );
    final photo = _photo;
    try {
      if (photo == null) {
        // No photo: offline-first via the sync queue.
        await ref.read(syncServiceProvider).reportFault(body);
      } else {
        // With a photo we need the server id, so create online then upload.
        final api = ref.read(apiDataSourceProvider);
        final faultId = await api.createFault(body);
        await api.uploadFaultPhoto(
          faultId,
          bytes: photo.bytes,
          filename: photo.filename,
          mimeType: photo.mimeType,
        );
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Envoi impossible — la photo nécessite une connexion.'),
        ),
      );
      return;
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Panne déclarée')),
    );
    context.go('/missions');
  }

  @override
  Widget build(BuildContext context) {
    final machine =
        ref.watch(machinesByIdProvider).valueOrNull?[widget.machineId];

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/missions'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.close, size: 22),
            onPressed: () => context.go('/missions'),
          ),
        ],
      ),
      body: machine == null
          ? const Center(
              child: Text(
                'Machine introuvable.',
                style: TextStyle(color: AppColors.mute),
              ),
            )
          : _Body(
              machine: machine,
              type: _type,
              severity: _severity,
              description: _description,
              valid: _valid,
              submitting: _submitting,
              hasPhoto: _photo != null,
              onType: (t) => setState(() => _type = t),
              onSeverity: (s) => setState(() => _severity = s),
              onPickPhoto: _pickPhoto,
              onSubmit: _submit,
            ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.machine,
    required this.type,
    required this.severity,
    required this.description,
    required this.valid,
    required this.submitting,
    required this.hasPhoto,
    required this.onType,
    required this.onSeverity,
    required this.onPickPhoto,
    required this.onSubmit,
  });

  final Machine machine;
  final FaultType type;
  final FaultSeverity severity;
  final TextEditingController description;
  final bool valid;
  final bool submitting;
  final bool hasPhoto;
  final ValueChanged<FaultType> onType;
  final ValueChanged<FaultSeverity> onSeverity;
  final VoidCallback onPickPhoto;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
      children: [
        const Text(
          'NOUVELLE PANNE',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            color: AppColors.crit,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Quel type ?',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 16),
        _MachineChip(machine: machine),
        const SizedBox(height: 20),
        for (final o in _typeOptions)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _TypeRow(
              label: o.$2,
              sub: o.$3,
              selected: type == o.$1,
              onTap: () => onType(o.$1),
            ),
          ),
        const SizedBox(height: 14),
        const _Label('Gravité'),
        const SizedBox(height: 8),
        Row(
          children: [
            for (final o in _severityOptions) ...[
              Expanded(
                child: _SeverityPill(
                  label: o.$2,
                  selected: severity == o.$1,
                  critical: o.$1 == FaultSeverity.critical,
                  onTap: () => onSeverity(o.$1),
                ),
              ),
              if (o.$1 != _severityOptions.last.$1) const SizedBox(width: 8),
            ],
          ],
        ),
        const SizedBox(height: 18),
        const _Label('Description'),
        const SizedBox(height: 8),
        TextField(
          controller: description,
          minLines: 3,
          maxLines: 5,
          maxLength: 500,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            hintText: 'Décrivez le problème observé sur la machine…',
            filled: true,
            fillColor: AppColors.bgSoft,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.line),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.line),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.brand, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _PhotoButton(
          hasPhoto: hasPhoto,
          onTap: submitting ? null : onPickPhoto,
        ),
        const SizedBox(height: 16),
        _Cta(
          label: submitting ? 'Envoi…' : 'Déclarer la panne',
          onTap: valid && !submitting ? onSubmit : null,
        ),
      ],
    );
  }
}

class _PhotoButton extends StatelessWidget {
  const _PhotoButton({required this.hasPhoto, this.onTap});

  final bool hasPhoto;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: hasPhoto ? AppColors.brand50 : AppColors.soft,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: hasPhoto ? AppColors.brand : AppColors.faint,
            style: hasPhoto ? BorderStyle.solid : BorderStyle.none,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: hasPhoto ? AppColors.brand : AppColors.bg,
                borderRadius: BorderRadius.circular(9),
                border: Border.all(
                  color: hasPhoto ? AppColors.brand : AppColors.line,
                ),
              ),
              child: Icon(
                hasPhoto ? Icons.check : Icons.photo_camera_outlined,
                size: 18,
                color: hasPhoto ? Colors.white : AppColors.ink,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hasPhoto ? 'Photo ajoutée' : 'Ajouter une photo',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: hasPhoto ? AppColors.brandDeep : AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hasPhoto
                        ? 'Appuyez pour reprendre'
                        : 'Prenez le problème en photo (nécessite une connexion)',
                    style:
                        const TextStyle(fontSize: 11.5, color: AppColors.mute),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MachineChip extends StatelessWidget {
  const _MachineChip({required this.machine});

  final Machine machine;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.brand50,
        border: Border.all(color: AppColors.brand100),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      machine.code,
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.brandDeep,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                    const SizedBox(width: 7),
                    const Text('·', style: TextStyle(color: AppColors.mute)),
                    const SizedBox(width: 7),
                    Flexible(
                      child: Text(
                        machine.workshop,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppColors.mute,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  machine.name,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600,
                    color: AppColors.brandDeep,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.brand,
              borderRadius: BorderRadius.circular(100),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check, size: 12, color: Colors.white),
                SizedBox(width: 4),
                Text(
                  'Scanné',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: AppColors.mute,
        letterSpacing: 0.4,
      ),
    );
  }
}

class _TypeRow extends StatelessWidget {
  const _TypeRow({
    required this.label,
    required this.sub,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String sub;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.bg : Colors.transparent,
          border: Border.all(
            color: selected ? AppColors.ink : AppColors.lineSoft,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sub,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: AppColors.mute,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppColors.brandDeep : Colors.transparent,
                border: Border.all(
                  color: selected ? AppColors.brandDeep : AppColors.line,
                  width: 1.5,
                ),
              ),
              child: selected
                  ? const Icon(
                      Icons.check,
                      size: 13,
                      color: AppColors.brandBright,
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _SeverityPill extends StatelessWidget {
  const _SeverityPill({
    required this.label,
    required this.selected,
    required this.critical,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final bool critical;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = critical ? AppColors.crit : AppColors.ink;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(100),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 11),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? accent : Colors.transparent,
          border: Border.all(color: selected ? accent : AppColors.line),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : AppColors.text,
          ),
        ),
      ),
    );
  }
}

class _Cta extends StatelessWidget {
  const _Cta({required this.label, this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Material(
      color: enabled ? AppColors.brandDeep : AppColors.faint,
      borderRadius: BorderRadius.circular(100),
      child: InkWell(
        borderRadius: BorderRadius.circular(100),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 15),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

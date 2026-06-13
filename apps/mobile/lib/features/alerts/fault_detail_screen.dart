import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/core/widgets/app_pill.dart';
import 'package:maintflow_mobile/data/models/attachment.dart';
import 'package:maintflow_mobile/data/models/fault.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/alerts/alerts_providers.dart';
import 'package:maintflow_mobile/features/alerts/alerts_screen.dart'
    show faultTypeLabel, severityBadge;
import 'package:maintflow_mobile/features/missions/missions_providers.dart';

const _months = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

String _longDate(DateTime d) => '${d.day} ${_months[d.month - 1]} ${d.year}';

String _ref(String id) {
  final tail = id.length <= 4 ? id : id.substring(id.length - 4);
  return 'F-${tail.toUpperCase()}';
}

/// Fault detail — identity, machine, reporter, and the attached photos
/// (fetched online with signed URLs). Reached from the alerts feed.
class FaultDetailScreen extends ConsumerWidget {
  const FaultDetailScreen({required this.faultId, super.key});

  final String faultId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fault = ref.watch(faultByIdProvider(faultId));
    final machine =
        ref.watch(machinesByIdProvider).valueOrNull?[fault?.machineId];

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/alerts'),
        ),
        title: Text(
          fault == null ? '' : _ref(fault.id),
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.mute,
            fontFeatures: [FontFeature.tabularFigures()],
          ),
        ),
        centerTitle: true,
      ),
      body: fault == null
          ? const Center(
              child: Text(
                'Panne introuvable.',
                style: TextStyle(color: AppColors.mute),
              ),
            )
          : _Body(fault: fault, machine: machine),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.fault, this.machine});

  final Fault fault;
  final Machine? machine;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (label, tone) = severityBadge(fault.severity);
    final attachments = ref.watch(faultAttachmentsProvider(fault.id));

    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
      children: [
        Row(
          children: [
            AppPill(label, tone: tone, dot: tone == PillTone.crit),
            const SizedBox(width: 8),
            Text(
              faultTypeLabel(fault.type),
              style: const TextStyle(fontSize: 12, color: AppColors.mute),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          fault.description,
          style: const TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.w700,
            height: 1.3,
            letterSpacing: -0.3,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 16),
        if (machine != null)
          InkWell(
            onTap: () => context.push('/machines/${machine!.id}'),
            borderRadius: BorderRadius.circular(12),
            child: _MachineChip(machine: machine!),
          ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _MetaTile(
                label: 'Signalée le',
                value: _longDate(fault.reportedAt),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MetaTile(
                label: 'Cause',
                value: fault.rootCause ?? '—',
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const Text(
          'PHOTOS',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.mute,
            letterSpacing: 0.4,
          ),
        ),
        const SizedBox(height: 10),
        attachments.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(
              child: CircularProgressIndicator(color: AppColors.brand),
            ),
          ),
          error: (e, _) => _PhotosError(
            onRetry: () => ref.invalidate(faultAttachmentsProvider(fault.id)),
          ),
          data: (items) => items.isEmpty
              ? const _NoPhotos()
              : Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [for (final a in items) _Thumb(attachment: a)],
                ),
        ),
      ],
    );
  }
}

class _Thumb extends StatelessWidget {
  const _Thumb({required this.attachment});

  final Attachment attachment;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 104,
        height: 104,
        color: AppColors.soft,
        child: Image.network(
          attachment.url,
          fit: BoxFit.cover,
          loadingBuilder: (context, child, progress) => progress == null
              ? child
              : const Center(
                  child: SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.brand,
                    ),
                  ),
                ),
          errorBuilder: (context, _, __) => const Center(
            child: Icon(
              Icons.broken_image_outlined,
              color: AppColors.faint,
              size: 24,
            ),
          ),
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
          Text(
            machine.code,
            style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: AppColors.brandDeep,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              machine.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.brandDeep,
              ),
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.brandDeep, size: 18),
        ],
      ),
    );
  }
}

class _MetaTile extends StatelessWidget {
  const _MetaTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.bgSoft,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppColors.mute,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _NoPhotos extends StatelessWidget {
  const _NoPhotos();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.lineSoft),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(
        child: Text(
          'Aucune photo pour cette panne.',
          style: TextStyle(fontSize: 12.5, color: AppColors.mute),
        ),
      ),
    );
  }
}

class _PhotosError extends StatelessWidget {
  const _PhotosError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.lineSoft),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          const Text(
            'Photos indisponibles (hors-ligne ?).',
            style: TextStyle(fontSize: 12.5, color: AppColors.mute),
          ),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: onRetry, child: const Text('Réessayer')),
        ],
      ),
    );
  }
}

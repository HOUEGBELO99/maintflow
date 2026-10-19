import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/data/models/machine.dart';
import 'package:maintflow_mobile/features/missions/missions_providers.dart';
import 'package:maintflow_mobile/features/scan/scan_providers.dart';

/// Dark background of the scanner, mirroring the prototype `ScanScreen`.
const _scanBg = Color(0xFF0A100C);

/// "Scanner" — points the camera at a machine QR tag, resolves it against the
/// cached machines, and lets the technician jump to that machine's
/// intervention. Mirrors the prototype: dark frame, bright-green corners and a
/// sweeping scan line. Falls back to manual ID entry when the camera is
/// unavailable (simulator, denied permission).
class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen>
    with SingleTickerProviderStateMixin {
  late final MobileScannerController _controller;
  late final AnimationController _lineCtrl;

  /// Guards against handling a burst of detections while the result sheet is up.
  bool _busy = false;

  /// True while a scanned payload is being matched against the machine cache.
  bool _resolving = false;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      // `normal`, not `noDuplicates`: the latter silently ignores the same tag
      // scanned again after "Réessayer". Bursts are handled by [_busy].
      detectionSpeed: DetectionSpeed.normal,
      formats: const [BarcodeFormat.qrCode],
    );
    _lineCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _lineCtrl.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_busy) return;
    final raw = capture.barcodes
        .map((b) => b.rawValue)
        .firstWhere((v) => v != null && v.isNotEmpty, orElse: () => null);
    if (raw == null) return;
    _handle(raw);
  }

  Future<void> _handle(String raw) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _resolving = true;
    });
    unawaited(_controller.stop());

    // The machine cache may still be loading (scanner opened right after
    // login, or from a screen that doesn't watch it): wait for it instead of
    // reporting a valid tag as unknown.
    final byId = await _loadMachines();
    final machine = resolveScannedMachine(
      raw,
      indexByCode(byId.values),
      byId: byId,
    );
    if (!mounted) return;
    setState(() => _resolving = false);
    unawaited(
      machine != null
          ? HapticFeedback.mediumImpact()
          : HapticFeedback.heavyImpact(),
    );

    var navigated = false;
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => ScanResultSheet(
        raw: raw,
        machine: machine,
        catalogEmpty: byId.isEmpty,
        onOpenIntervention: (id) {
          navigated = true;
          Navigator.of(context).pop();
          context.go('/missions/$id');
        },
        onReportFault: (machineId) {
          navigated = true;
          Navigator.of(context).pop();
          // Replace the scanner so the camera doesn't keep running underneath.
          context.pushReplacement('/report?machineId=$machineId');
        },
        onDismiss: () => Navigator.of(context).pop(),
      ),
    );

    // Sheet closed without navigating away — resume scanning.
    if (!mounted || navigated) return;
    setState(() => _busy = false);
    await _controller.start();
  }

  /// The cached machines, waiting (bounded) for the first load if needed.
  Future<Map<String, Machine>> _loadMachines() async {
    try {
      return await ref
          .read(machinesByIdProvider.future)
          .timeout(const Duration(seconds: 6));
    } on Object {
      return ref.read(machinesByIdProvider).valueOrNull ??
          const <String, Machine>{};
    }
  }

  Future<void> _manualEntry() async {
    final code = await showDialog<String>(
      context: context,
      builder: (_) => const _ManualEntryDialog(),
    );
    if (code == null || code.trim().isEmpty) return;
    await _handle(code.trim());
  }

  @override
  Widget build(BuildContext context) {
    // Keep the machine cache alive (and refreshing) while the scanner is open,
    // so a scan resolves instantly instead of racing a cold provider.
    ref.watch(machinesByIdProvider);
    return Scaffold(
      backgroundColor: _scanBg,
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error) => _CameraUnavailable(
              onManual: _manualEntry,
              permissionDenied:
                  error.errorCode == MobileScannerErrorCode.permissionDenied,
            ),
          ),
          // Darkening veil so the bright-green frame reads against any feed.
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                radius: 0.9,
                colors: [Color(0x660A100C), Color(0xE60A100C)],
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                _TopBar(
                  controller: _controller,
                  onClose: () => context.canPop()
                      ? context.pop()
                      : context.go('/missions'),
                ),
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _ScanFrame(progress: _lineCtrl, resolving: _resolving),
                        const SizedBox(height: 40),
                        const _Caption(),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
                  child: _ManualEntryButton(onTap: _manualEntry),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.controller, required this.onClose});

  final MobileScannerController controller;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 4, 8, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: onClose,
            icon: const Icon(Icons.close, color: Colors.white, size: 20),
            tooltip: 'Fermer',
          ),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: AppColors.brandBright,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.brandBright.withValues(alpha: 0.6),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'SCANNER',
                  style: TextStyle(
                    color: AppColors.brandBright,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: controller,
            builder: (context, state, _) {
              final on = state.torchState == TorchState.on;
              final usable = state.torchState != TorchState.unavailable;
              return IconButton(
                onPressed: usable ? controller.toggleTorch : null,
                tooltip: 'Lampe',
                icon: Icon(
                  on ? Icons.flash_on : Icons.flash_off,
                  color: on ? AppColors.brandBright : Colors.white70,
                  size: 20,
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

/// The 240×240 framing square: four bright-green corners and a sweeping line.
class _ScanFrame extends StatelessWidget {
  const _ScanFrame({required this.progress, this.resolving = false});

  final Animation<double> progress;
  final bool resolving;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 240,
      height: 240,
      child: Stack(
        children: [
          for (final c in const [
            (top: true, left: true),
            (top: true, left: false),
            (top: false, left: true),
            (top: false, left: false),
          ])
            Positioned(
              top: c.top ? 0 : null,
              bottom: c.top ? null : 0,
              left: c.left ? 0 : null,
              right: c.left ? null : 0,
              child: _Corner(top: c.top, left: c.left),
            ),
          if (resolving)
            const Center(
              child: SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: AppColors.brandBright,
                ),
              ),
            ),
          if (!resolving)
            AnimatedBuilder(
              animation: progress,
              builder: (context, _) {
                // Sweep the line within the inner 216px (12px inset each side).
                final t = progress.value;
                return Positioned(
                  left: 12,
                  right: 12,
                  top: 12 + t * 216,
                  child: Container(
                    height: 2,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Colors.transparent,
                          AppColors.brandBright,
                          Colors.transparent,
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.brandBright.withValues(alpha: 0.7),
                          blurRadius: 12,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _Corner extends StatelessWidget {
  const _Corner({required this.top, required this.left});

  final bool top;
  final bool left;

  @override
  Widget build(BuildContext context) {
    const side = BorderSide(color: AppColors.brandBright, width: 2);
    const radius = Radius.circular(8);
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        border: Border(
          top: top ? side : BorderSide.none,
          bottom: top ? BorderSide.none : side,
          left: left ? side : BorderSide.none,
          right: left ? BorderSide.none : side,
        ),
        borderRadius: BorderRadius.only(
          topLeft: top && left ? radius : Radius.zero,
          topRight: top && !left ? radius : Radius.zero,
          bottomLeft: !top && left ? radius : Radius.zero,
          bottomRight: !top && !left ? radius : Radius.zero,
        ),
      ),
    );
  }
}

class _Caption extends StatelessWidget {
  const _Caption();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 240,
      child: Column(
        children: [
          Text(
            'Placez le QR dans le cadre',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 6),
          Text(
            "L'identification de la machine est automatique.",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white60,
              fontSize: 12.5,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _ManualEntryButton extends StatelessWidget {
  const _ManualEntryButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          backgroundColor: Colors.white.withValues(alpha: 0.06),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(100),
          ),
        ),
        child: const Text(
          "Saisir l'ID manuellement",
          style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _CameraUnavailable extends StatelessWidget {
  const _CameraUnavailable({
    required this.onManual,
    this.permissionDenied = false,
  });

  final VoidCallback onManual;

  /// The user refused camera access (vs. no camera, e.g. a simulator).
  final bool permissionDenied;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: _scanBg,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.no_photography_outlined,
                color: Colors.white38,
                size: 40,
              ),
              const SizedBox(height: 16),
              Text(
                permissionDenied
                    ? 'Accès caméra refusé'
                    : 'Caméra indisponible',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                permissionDenied
                    ? "Autorisez MaintFlow à utiliser l'appareil photo dans "
                        "les Réglages du téléphone, ou saisissez l'ID."
                    : "Aucune caméra détectée. Saisissez l'ID de la machine.",
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white54, fontSize: 12.5),
              ),
              const SizedBox(height: 24),
              _ManualEntryButton(onTap: onManual),
            ],
          ),
        ),
      ),
    );
  }
}

class _ManualEntryDialog extends StatefulWidget {
  const _ManualEntryDialog();

  @override
  State<_ManualEntryDialog> createState() => _ManualEntryDialogState();
}

class _ManualEntryDialogState extends State<_ManualEntryDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() => Navigator.of(context).pop(_controller.text);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColors.bg,
      title: const Text('Identifiant machine'),
      content: TextField(
        controller: _controller,
        autofocus: true,
        textCapitalization: TextCapitalization.characters,
        textInputAction: TextInputAction.go,
        onSubmitted: (_) => _submit(),
        decoration: const InputDecoration(
          hintText: 'MCH-002',
          prefixIcon: Icon(Icons.qr_code_2),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Annuler'),
        ),
        FilledButton(
          onPressed: _submit,
          style: FilledButton.styleFrom(backgroundColor: AppColors.brand),
          child: const Text('Valider'),
        ),
      ],
    );
  }
}

/// Bottom sheet shown after a scan or manual entry. Confirms the resolved
/// machine (with a jump to its intervention) or reports that the code is
/// unknown. Presentational: navigation is delegated to callbacks.
class ScanResultSheet extends ConsumerWidget {
  const ScanResultSheet({
    required this.raw,
    required this.machine,
    required this.onOpenIntervention,
    required this.onReportFault,
    required this.onDismiss,
    this.catalogEmpty = false,
    super.key,
  });

  final String raw;
  final Machine? machine;

  /// No machine has been synced yet (first launch offline): the tag may be
  /// perfectly valid, so say so instead of "unknown machine".
  final bool catalogEmpty;
  final ValueChanged<String> onOpenIntervention;
  final ValueChanged<String> onReportFault;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final m = machine;
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        20 + MediaQuery.of(context).padding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.line,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 18),
          if (m == null)
            _NotFound(raw: raw, catalogEmpty: catalogEmpty)
          else
            _Found(
              machine: m,
              onOpenIntervention: onOpenIntervention,
              onReportFault: onReportFault,
            ),
          const SizedBox(height: 14),
          TextButton(
            onPressed: onDismiss,
            child: Text(m == null ? 'Réessayer' : 'Fermer'),
          ),
        ],
      ),
    );
  }
}

class _Found extends ConsumerWidget {
  const _Found({
    required this.machine,
    required this.onOpenIntervention,
    required this.onReportFault,
  });

  final Machine machine;
  final ValueChanged<String> onOpenIntervention;
  final ValueChanged<String> onReportFault;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final intervention = ref.watch(interventionForMachineProvider(machine.id));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
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
                        const Text(
                          '·',
                          style: TextStyle(color: AppColors.mute),
                        ),
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
        ),
        const SizedBox(height: 16),
        if (intervention != null)
          FilledButton(
            onPressed: () => onOpenIntervention(intervention.id),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.ink,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              "Ouvrir l'intervention",
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          )
        else
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            alignment: Alignment.center,
            child: const Text(
              'Aucune intervention assignée sur cette machine.',
              style: TextStyle(color: AppColors.mute, fontSize: 12.5),
            ),
          ),
        const SizedBox(height: 8),
        TextButton.icon(
          onPressed: () => onReportFault(machine.id),
          icon: const Icon(
            Icons.report_problem_outlined,
            size: 18,
            color: AppColors.crit,
          ),
          label: const Text(
            'Signaler une panne',
            style: TextStyle(
              color: AppColors.crit,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _NotFound extends StatelessWidget {
  const _NotFound({required this.raw, this.catalogEmpty = false});

  final String raw;
  final bool catalogEmpty;

  @override
  Widget build(BuildContext context) {
    final code = extractMachineCode(raw) ?? raw;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.critBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.error_outline,
                color: AppColors.critFg,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                catalogEmpty ? 'Parc non synchronisé' : 'Machine introuvable',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          catalogEmpty
              ? "La liste des machines n'est pas encore téléchargée sur ce "
                  'téléphone. Connectez-vous au réseau puis réessayez.'
              : 'Le code « $code » ne correspond à aucune machine de votre '
                  "site. Vérifiez l'étiquette ou saisissez l'ID à la main.",
          style: const TextStyle(color: AppColors.mute, fontSize: 12.5),
        ),
      ],
    );
  }
}

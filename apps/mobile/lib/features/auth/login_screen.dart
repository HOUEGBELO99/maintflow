import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:maintflow_mobile/core/theme/app_theme.dart';
import 'package:maintflow_mobile/features/auth/auth_controller.dart';

/// Login screen — dark hero strip on top (mirrors the desktop login-aside DNA),
/// then the form. Local dev signs in by email via the API dev-login route.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController(text: 's.diallo@usine.fr');
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    await ref
        .read(authControllerProvider.notifier)
        .signIn(_email.text.trim(), _password.text);
    final state = ref.read(authControllerProvider);
    if (state.hasError && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Connexion impossible — vérifiez vos identifiants.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(authControllerProvider).isLoading;
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: _Hero(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Bonjour.',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.6,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Connectez-vous pour accéder à votre parc.',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.mute,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 28),
                    const _FieldLabel('E-mail'),
                    TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                      decoration: const InputDecoration(
                        isDense: true,
                        contentPadding: EdgeInsets.only(bottom: 11),
                        enabledBorder: UnderlineInputBorder(
                          borderSide:
                              BorderSide(color: AppColors.ink, width: 1.5),
                        ),
                        focusedBorder: UnderlineInputBorder(
                          borderSide:
                              BorderSide(color: AppColors.ink, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 22),
                    const _FieldLabel('Mot de passe'),
                    TextField(
                      controller: _password,
                      obscureText: _obscure,
                      autocorrect: false,
                      enableSuggestions: false,
                      onSubmitted: (_) => _signIn(),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.only(bottom: 11),
                        enabledBorder: const UnderlineInputBorder(
                          borderSide: BorderSide(color: AppColors.line),
                        ),
                        focusedBorder: const UnderlineInputBorder(
                          borderSide:
                              BorderSide(color: AppColors.ink, width: 1.5),
                        ),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            size: 18,
                            color: AppColors.mute,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Spacer(),
                    _PrimaryCta(
                      label: 'Se connecter',
                      loading: loading,
                      onTap: _signIn,
                    ),
                    const SizedBox(height: 10),
                    _GhostCta(
                      label: 'Scanner mon invitation',
                      icon: Icons.qr_code_scanner,
                      onTap: () {},
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 20, 22, 20),
      decoration: BoxDecoration(
        color: AppColors.brandDeep,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Image.asset(
                'assets/logo-mark.png',
                height: 30,
                filterQuality: FilterQuality.medium,
              ),
              const SizedBox(width: 10),
              const Text(
                'MaintFlow',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          const Text(
            'GMAO · V2.4',
            style: TextStyle(
              color: AppColors.brandBright,
              fontSize: 10.5,
              fontFeatures: [FontFeature.tabularFigures()],
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Le terrain\nen temps réel.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w700,
              height: 1.15,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 18),
          const Divider(color: Colors.white24, height: 1),
          const SizedBox(height: 14),
          const Row(
            children: [
              _HeroStat(value: '12', label: 'Machines'),
              SizedBox(width: 20),
              _HeroStat(value: '3', label: 'Pannes'),
              SizedBox(width: 20),
              _HeroStat(value: '92%', label: 'Dispo.'),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            color: AppColors.brandBright,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
            fontFeatures: [FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 1),
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 9.5,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.6,
          ),
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.mute,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class _PrimaryCta extends StatelessWidget {
  const _PrimaryCta({
    required this.label,
    required this.onTap,
    this.loading = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.brandDeep,
      borderRadius: BorderRadius.circular(100),
      child: InkWell(
        borderRadius: BorderRadius.circular(100),
        onTap: loading ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 18),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 10),
              if (loading)
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.brandBright,
                  ),
                )
              else
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.brandBright,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.arrow_forward,
                    size: 12,
                    color: AppColors.brandDeep,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GhostCta extends StatelessWidget {
  const _GhostCta({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: AppColors.line),
        borderRadius: BorderRadius.circular(100),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(100),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 15),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: AppColors.ink),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

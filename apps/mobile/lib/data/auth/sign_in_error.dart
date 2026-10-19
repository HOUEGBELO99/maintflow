import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Turns a sign-in failure into a message the technician can act on.
///
/// Sign-in is two hops — Supabase Auth (credentials) then `GET /auth/me` on the
/// API (profile) — and each fails differently. A single "check your
/// credentials" message sent people retyping a correct password while the API
/// (free hosting) was simply waking up.
String describeSignInError(Object error) {
  if (error is AuthException) {
    final code = error.code ?? '';
    final message = error.message.toLowerCase();
    if (code == 'invalid_credentials' ||
        message.contains('invalid login credentials')) {
      return 'E-mail ou mot de passe incorrect.';
    }
    if (code == 'email_not_confirmed' || message.contains('not confirmed')) {
      return "Compte non confirmé — demandez à l'administrateur de le valider.";
    }
    if (error.statusCode == '429' || code == 'over_request_rate_limit') {
      return 'Trop de tentatives — patientez une minute puis réessayez.';
    }
    if (error is AuthRetryableFetchException) {
      return 'Pas de connexion au serveur — vérifiez votre réseau.';
    }
    return 'Connexion refusée : ${error.message}';
  }

  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Le serveur met trop de temps à répondre (il démarre peut-être). '
            'Réessayez dans un instant.';
      case DioExceptionType.connectionError:
        return 'Pas de connexion au serveur — vérifiez votre réseau.';
      case DioExceptionType.badResponse:
        final status = error.response?.statusCode ?? 0;
        if (status == 401 || status == 403 || status == 404) {
          return "Compte reconnu, mais pas encore autorisé sur MaintFlow — "
              "contactez l'administrateur.";
        }
        if (status >= 500) {
          return 'Le serveur rencontre une erreur — réessayez plus tard.';
        }
        return 'Connexion impossible (erreur $status).';
      case DioExceptionType.badCertificate:
      case DioExceptionType.cancel:
      case DioExceptionType.unknown:
        break;
    }
  }

  return 'Connexion impossible — réessayez.';
}

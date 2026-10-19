import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:maintflow_mobile/data/auth/sign_in_error.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

DioException _dio(DioExceptionType type, {int? status}) => DioException(
      requestOptions: RequestOptions(path: '/auth/me'),
      type: type,
      response: status == null
          ? null
          : Response<void>(
              requestOptions: RequestOptions(path: '/auth/me'),
              statusCode: status,
            ),
    );

void main() {
  test('wrong password says so', () {
    expect(
      describeSignInError(
        AuthApiException(
          'Invalid login credentials',
          statusCode: '400',
          code: 'invalid_credentials',
        ),
      ),
      'E-mail ou mot de passe incorrect.',
    );
  });

  test('a sleeping API is not blamed on the credentials', () {
    final msg = describeSignInError(_dio(DioExceptionType.receiveTimeout));
    expect(msg, contains('démarre'));
    expect(msg, isNot(contains('mot de passe')));
  });

  test('no network', () {
    expect(
      describeSignInError(_dio(DioExceptionType.connectionError)),
      contains('réseau'),
    );
  });

  test('valid Supabase account without a MaintFlow profile', () {
    expect(
      describeSignInError(_dio(DioExceptionType.badResponse, status: 401)),
      contains("contactez l'administrateur"),
    );
  });

  test('unknown errors fall back to a neutral message', () {
    expect(
      describeSignInError(Exception('x')),
      'Connexion impossible — réessayez.',
    );
  });
}

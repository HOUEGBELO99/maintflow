import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:maintflow_mobile/data/models/enums.dart';

part 'session_user.freezed.dart';
part 'session_user.g.dart';

/// The authenticated technician. Mirrors the API `dev-login` user payload.
@freezed
class SessionUser with _$SessionUser {
  const factory SessionUser({
    required String id,
    required String email,
    required String name,
    required UserRole role,
    required String siteId,
  }) = _SessionUser;

  factory SessionUser.fromJson(Map<String, dynamic> json) =>
      _$SessionUserFromJson(json);
}

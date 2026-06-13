import 'package:freezed_annotation/freezed_annotation.dart';

part 'attachment.freezed.dart';
part 'attachment.g.dart';

/// A stored file (photo/signature/report) returned by the API `files` endpoints,
/// already carrying a short-lived signed [url] for display.
@freezed
class Attachment with _$Attachment {
  const factory Attachment({
    required String id,
    required String kind,
    required String mimeType,
    required String url,
  }) = _Attachment;

  factory Attachment.fromJson(Map<String, dynamic> json) =>
      _$AttachmentFromJson(json);
}

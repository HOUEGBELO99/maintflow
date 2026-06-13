import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

/// A photo picked from the camera: raw bytes + metadata for a multipart upload.
typedef PickedPhoto = ({List<int> bytes, String filename, String mimeType});

/// Captures a photo, behind an interface so the report flow stays testable
/// without the platform camera.
abstract interface class PhotoPicker {
  /// Returns the captured photo, or null if the user cancelled.
  Future<PickedPhoto?> capture();
}

class ImagePickerPhotoPicker implements PhotoPicker {
  const ImagePickerPhotoPicker();

  @override
  Future<PickedPhoto?> capture() async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
      maxWidth: 1600,
    );
    if (file == null) return null;
    return (
      bytes: await file.readAsBytes(),
      filename: file.name,
      mimeType: file.mimeType ?? 'image/jpeg',
    );
  }
}

final photoPickerProvider = Provider<PhotoPicker>(
  (ref) => const ImagePickerPhotoPicker(),
);

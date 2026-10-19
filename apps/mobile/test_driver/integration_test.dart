import 'dart:io';

import 'package:integration_test/integration_test_driver_extended.dart';

/// `flutter drive` host: saves every `binding.takeScreenshot(name)` from the
/// on-device test to `build/e2e_screens/<name>.png` for visual review.
Future<void> main() => integrationDriver(
      onScreenshot: (name, bytes, [args]) async {
        final file = File('build/e2e_screens/$name.png')
          ..createSync(recursive: true);
        file.writeAsBytesSync(bytes);
        return true;
      },
    );

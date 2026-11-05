# Original Fortnightly wordmark

These are the original, unmodified transparent PNGs used by Flutter Gallery's Fortnightly study. They supply the blackletter **The Fortnightly** wordmark for the MD3 app-bar image examples. No reference screenshot was cropped, no lettering was redrawn, and no font binary was added.

## Source and integrity

- Published package: [flutter_gallery_assets 1.0.2](https://pub.dev/packages/flutter_gallery_assets/versions/1.0.2).
- Package metadata: [pub.dev API](https://pub.dev/api/packages/flutter_gallery_assets/versions/1.0.2).
- Original publication: [flutter_gallery_assets-1.0.2.tar.gz](https://pub.dev/api/archives/flutter_gallery_assets-1.0.2.tar.gz).
- Verified archive SHA-256: `f8fecfeebcfbe80a2fabc00c0834046890abe681f59d3e2c5b1028faf887d94b`.
- Original base member: `lib/fortnightly/fortnightly_title.png`.
- Upstream use: [Flutter Gallery shared.dart, revision d12640d4b08ee6e706fd8c64a83fba0620c9aa8d](https://github.com/flutter-team-archive/gallery/blob/d12640d4b08ee6e706fd8c64a83fba0620c9aa8d/lib/studies/fortnightly/shared.dart), using `Image.asset('fortnightly/fortnightly_title.png', package: 'flutter_gallery_assets')`.

The package's former `flutter/flutter_gallery_assets` repository returned 404 when checked on 2026-10-26. The published package was therefore read as a stream, its complete SHA-256 checked against the registry metadata, and only the files listed below retained. The archive and other package assets are not included in this project.

| Local file                       | Original member                              | Pixels   | Local bytes | Local SHA-256                                                      |
| -------------------------------- | -------------------------------------------- | -------- | ----------: | ------------------------------------------------------------------ |
| `fortnightly_title.png`          | `lib/fortnightly/fortnightly_title.png`      | 110 × 18 |       1,753 | `1ccab488652a1268826ceb648f6055939bf9d3f51ad248736cb6958595d1b3ae` |
| `fortnightly_title@2x.png`       | `lib/fortnightly/2.0x/fortnightly_title.png` | 220 × 36 |       4,145 | `c25d133201cea947820ddefbdaad88d12e9d1ddcd0c7c0bbca21188a82486589` |
| `fortnightly_title@3x.png`       | `lib/fortnightly/3.0x/fortnightly_title.png` | 330 × 54 |       6,812 | `da5f0acd3899a9481c17f392305f0a085869aba235d9a6410d99cbbe818d8c3b` |
| `fortnightly_title@4x.png`       | `lib/fortnightly/4.0x/fortnightly_title.png` | 440 × 72 |       9,638 | `2f24a98bf1b3190eb38981b8ecdc671e759d1747f04fce55a8716cf98b92cb1e` |
| `LICENSE.flutter-gallery-assets` | `LICENSE`                                    | —        |      24,140 | `6b167c9b0d8e9b17fd2b9eeaac9518ad29f9896e6d793202c738c8db43b1c2d9` |

The density files were renamed to React Native's `@2x`, `@3x` and `@4x` convention; their bytes and pixel dimensions were preserved. All four images have the same 55:9 aspect ratio. The archive also lists a 1.5x version; this import retains the requested base/2x/3x/4x set. Requiring the base filename lets Metro select a density asset. Enlarging beyond the supplied pixel resolution still entails raster scaling.

## License

[LICENSE.flutter-gallery-assets](LICENSE.flutter-gallery-assets) retains the full text from the published archive, with only textual whitespace normalization: 373 CRLF line endings were converted to LF and trailing spaces/tabs removed from five lines. No copyright notice, license condition, disclaimer or other non-whitespace content was changed. The original archive member was 24,519 bytes with SHA-256 `7bbee97ff6d9a19cf7c1ee7b0bd25b5d1d5735fc9a2202d7d903fdbb29c199b3`; the normalized local file's size and hash are listed above. The PNG files remain byte-for-byte originals.

Its package notice is **BSD 3-Clause**, Copyright 2018 The Chromium Authors. Preserve its copyright, redistribution conditions and disclaimer with these assets. The file also retains the original package's separate font notices; those font files are not bundled here. The same notices can be inspected on the [package's published license page](https://pub.dev/packages/flutter_gallery_assets/license).

These are example brand artwork assets from the Fortnightly study. Their inclusion does not replace the app's Roboto typography or the package's Material Symbols icon collection.

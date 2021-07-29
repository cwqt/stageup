// createThumbnailUrl = (meta: AssetMetaUnion[AssetType.Thumbnail]): string => {
//   const parameters: Except<AssetMetaUnion[AssetType.Thumbnail], 'playback_id'> = {
//     width: meta.width ?? 300,
//     height: meta.height ?? 300,
//     flip_h: meta.flip_h ?? false,
//     flip_v: meta.flip_v ?? false,
//     rotate: meta.rotate ?? 0,
//     time: meta.time ?? 0,
//     fit_mode: meta.fit_mode ?? 'smartcrop'
//   };

//   return `https://mux.com/${meta.playback_id}${stitchParameters(parameters)}`;
// };

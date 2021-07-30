// createGIFUrl = (meta: AssetMetaUnion[AssetType.AnimatedGIF]): string => {
//   const parameters: Except<AssetMetaUnion[AssetType.AnimatedGIF], 'playback_id'> = {
//     width: meta.width ?? 300,
//     height: meta.height ?? 300,
//     start: meta.start ?? 0,
//     end: meta.end ?? 0,
//     fps: meta.fps ?? 15
//   };

//   return `https://mux.com/${meta.playback_id}/${stitchParameters(parameters)}`;
// };

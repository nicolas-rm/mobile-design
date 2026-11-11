/**
 * Photograph/art regions isolated from the official MD3 figures and clips.
 * No reference status bar, app bar, label, pointer or action is baked into them.
 * Source URLs, frame times and crop rectangles are recorded beside these files.
 */
export const appBarReferenceImages = {
    dog: require('./assets/app-bars/media/recap-dog.png'),
    train: require('./assets/app-bars/media/recap-train.png'),
    mushrooms: require('./assets/app-bars/media/recap-mushrooms.png'),
    beekeeper: require('./assets/app-bars/media/recap-beekeeper.png'),
    tree: require('./assets/app-bars/media/hiking-tree.png'),
    tent: require('./assets/app-bars/media/hiking-tent.png'),
    valley: require('./assets/app-bars/media/recap-valley.png'),
    news: require('./assets/app-bars/media/news-mushrooms.png'),
    baker: require('./assets/app-bars/media/films-baker.png'),
    podcastRecording: require('./assets/app-bars/media/podcast-recording.png'),
    podcastRoom: require('./assets/app-bars/media/podcast-room.png'),
    trailSky: require('./assets/app-bars/media/trails-sky.png'),
    trailMap: require('./assets/app-bars/media/trails-map.png'),
    send: require('./assets/app-bars/media/send-illustration.png'),
    sushi: require('./assets/app-bars/media/sushi-food.png'),
    letterAvatar: require('./assets/app-bars/media/letter-avatar.png'),
} as const;

export const appBarRecapPhotos = [
    appBarReferenceImages.dog,
    appBarReferenceImages.train,
    appBarReferenceImages.mushrooms,
    appBarReferenceImages.beekeeper,
    appBarReferenceImages.tree,
    appBarReferenceImages.tent,
    appBarReferenceImages.valley,
] as const;

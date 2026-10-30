export type LastfmImages = {
  small: string;
  medium: string;
  large: string;
  extralarge: string;
};

export type LastfmTag = {
  name: string;
  url?: string;
};

export type RecentTrackItem = {
  track: string;
  artist: string;
  album: string;
  image: LastfmImages;
  isNowPlaying: boolean;
  url?: string | null;
};

export type TrackInfoData = {
  track: string;
  album: string;
  artist: string;
  userplaycount: number;
  lovedtrack: boolean;
  tags: LastfmTag[];
  url: string | null;
  image: LastfmImages;
  isNowPlaying?: boolean;
};

export type AlbumInfoData = {
  track?: string;
  album: string;
  artist: string;
  userplaycount: number;
  tags: LastfmTag[];
  url?: string | null;
  image: LastfmImages;
  isNowPlaying?: boolean;
};

export type ArtistInfoData = {
  track?: string;
  album?: string;
  artist: string;
  userplaycount: number;
  tags: LastfmTag[];
  url?: string | null;
  image: LastfmImages;
  isNowPlaying?: boolean;
};

export type TopTrackItem = {
  rank: string | number;
  image: string;
  track: {
    name: string;
    artist: string;
  };
  scrobbles: number;
};

export type TopAlbumItem = {
  rank: string | number;
  image: string;
  album: {
    name: string;
    artist: string;
  };
  scrobbles: number;
};

export type TopArtistItem = {
  rank: string | number;
  image: string;
  artist: {
    name: string;
  };
  scrobbles: number;
};

export type TopGridItem = TopTrackItem | TopAlbumItem | TopArtistItem;

export type CalendarDayItem = {
  day: number;
  title: string;
  subtitle?: string;
  scrobbles: number;
  image: string;
};



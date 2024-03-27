// See app/serializers/rest/media_attachment_serializer.rb

export type MediaAttachmentType =
  | 'image'
  | 'gifv'
  | 'video'
  | 'unknown'
  | 'audio';

type MetaKey = 'focus' | 'colors' | 'original' | 'small';

// TODO: this is probably not exact, maybe split it depending on the type of meta object?
interface MediaMeta {
  width: number;
  height: number;
  frame_rate?: string;
  duration?: number;
  bitrate?: number;
  size?: string;
  aspect?: number;
}

export interface ApiMediaAttachmentJSON {
  id: string;
  type: MediaAttachmentType;
  url: string;
  preview_url: string;
  remoteUrl: string;
  preview_remote_url: string;
  text_url: string;
  // TODO: this is most likely incorrect as well, what goes into this?
  meta: Record<MetaKey, MediaMeta>;
  description?: string;
  blurhash: string;
}

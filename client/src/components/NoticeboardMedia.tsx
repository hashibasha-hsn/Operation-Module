import {
  getNoticeboardMediaUrl,
  isNoticeboardVideo,
  type NoticeboardPost,
} from '@/lib/noticeboardApi';

type Props = {
  post: Pick<NoticeboardPost, 'fileUrl' | 'fileType' | 'title'>;
  className?: string;
};

export default function NoticeboardMedia({ post, className = 'w-full h-full object-cover' }: Props) {
  const mediaUrl = getNoticeboardMediaUrl(post.fileUrl);
  if (!mediaUrl) return null;

  if (isNoticeboardVideo(post.fileType)) {
    return (
      <video
        src={mediaUrl}
        controls
        className={className}
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={mediaUrl}
      alt={post.title}
      className={className}
      loading="lazy"
    />
  );
}

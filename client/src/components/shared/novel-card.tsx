import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Content, Genre } from "@shared/schema";
import { getRandomCoverImage, truncateText } from "@/lib/utils";

interface NovelCardProps {
  novel: Content;
  genres?: Genre[];
  horizontal?: boolean;
}

export function NovelCard({
  novel,
  genres,
  horizontal = false,
}: NovelCardProps) {
  const coverImage = novel.coverImage || getRandomCoverImage("novel");

  if (horizontal) {
    return (
      <Link href={`/truyen/${novel.id}`}>
        <Card className="h-40 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg transition-transform hover:scale-102">
          <div className="flex h-full">
            <img
              src={coverImage}
              alt={novel.title}
              className="w-28 h-full object-cover"
              loading="lazy"
            />
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-foreground">{novel.title}</h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {truncateText(novel.description || "", 80)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex space-x-1">
                  {genres && genres.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-1.5 py-0 h-5 bg-secondary/10 text-secondary"
                    >
                      {genres[0].name}
                    </Badge>
                  )}
                </div>
                {novel.status === "completed" ? (
                  <Badge className="text-xs bg-primary/10 text-primary">
                    Hoàn thành
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-secondary/10 text-secondary">
                    Đang cập nhật
                  </Badge>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/truyen/${novel.id}`}>
      <Card className="bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg transition-transform hover:scale-102">
        <div className="relative">
          <img
            src={coverImage}
            alt={novel.title}
            className="w-full h-56 object-cover"
            loading="lazy"
          />
          {novel.status === "completed" && (
            <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground">
              Hoàn thành
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-foreground truncate">
            {novel.title}
          </h3>
          {novel.alternativeTitle && (
            <p className="text-muted-foreground text-xs truncate">
              {novel.alternativeTitle}
            </p>
          )}

          {genres && genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {genres.slice(0, 2).map((genre) => (
                <Badge
                  key={genre.id}
                  variant="outline"
                  className="text-xs px-1.5 py-0 h-5 bg-secondary/10 text-secondary"
                >
                  {genre.name}
                </Badge>
              ))}
              {genres.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0 h-5 bg-muted text-muted-foreground"
                >
                  +{genres.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default NovelCard;

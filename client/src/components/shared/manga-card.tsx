import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Content, Genre } from "@shared/schema";
import { getRandomCoverImage } from "@/lib/utils";
import { hashId } from "@/lib/hashUtils";

interface MangaCardProps {
  manga: Content;
  genres?: Genre[];
  featured?: boolean;
}

export function MangaCard({ manga, genres, featured = false }: MangaCardProps) {
  const coverImage = manga.coverImage || getRandomCoverImage('manga');
  
  return (
    <Link href={`/truyen/${hashId(manga.id)}`}>
      <Card className={`bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg transition-all ${featured ? 'hover:scale-105' : 'hover:scale-102'}`}>
        <div className="relative">
          <img 
            src={coverImage}
            alt={manga.title} 
            className={`w-full object-cover ${featured ? 'h-72' : 'h-48'}`}
            loading="lazy"
          />
          {manga.status === 'completed' && (
            <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground">
              Hoàn thành
            </Badge>
          )}
        </div>
        <CardContent className={`p-3 ${featured ? '' : 'p-2'}`}>
          <h3 className={`font-medium text-foreground truncate ${featured ? 'text-base' : 'text-sm'}`}>
            {manga.title}
          </h3>
          {manga.alternativeTitle && (
            <p className="text-muted-foreground text-xs truncate">
              {manga.alternativeTitle}
            </p>
          )}
          
          {genres && genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {genres.slice(0, 2).map((genre) => (
                <Badge key={genre.id} variant="outline" className="text-xs px-1.5 py-0 h-5 bg-primary/5 text-primary">
                  {genre.name}
                </Badge>
              ))}
              {genres.length > 2 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-muted text-muted-foreground">
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

export default MangaCard;

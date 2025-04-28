import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";

interface ContentCardProps {
  content: {
    id: number;
    title: string;
    type: "manga" | "novel";
    status: "ongoing" | "completed" | "hiatus";
    createdAt: string;
    thumbnail?: string;
    views: number;
  };
}

export function ContentCard({ content }: ContentCardProps) {
  const defaultThumbnail = content.type === "manga" 
    ? "/images/default-manga.png" 
    : "/images/default-novel.png";

  const statusColors: Record<string, string> = {
    ongoing: "bg-green-500",
    completed: "bg-blue-500",
    hiatus: "bg-amber-500"
  };

  const typeLabel = content.type === "manga" ? "Truyện Tranh" : "Tiểu Thuyết";
  const statusLabel = {
    ongoing: "Đang Ra",
    completed: "Hoàn Thành",
    hiatus: "Tạm Ngừng"
  }[content.status];

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
      <Link to={`/${content.type}/${content.id}`}>
        <div className="block relative pt-[140%] overflow-hidden cursor-pointer">
          <img
            src={content.thumbnail || defaultThumbnail}
            alt={content.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {typeLabel}
            </Badge>
            <Badge variant="outline" className={`text-xs text-white ${statusColors[content.status]}`}>
              {statusLabel}
            </Badge>
          </div>
        </div>
      </Link>
      
      <CardContent className="flex-1 pt-3 pb-0">
        <Link to={`/${content.type}/${content.id}`}>
          <div className="cursor-pointer">
            <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors mb-1">
              {content.title}
            </h3>
          </div>
        </Link>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-2 pb-3">
        <div className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          <span>{content.views}</span>
        </div>
        <time dateTime={content.createdAt}>
          {formatDate(new Date(content.createdAt), 'dd/MM/yyyy')}
        </time>
      </CardFooter>
    </Card>
  );
}
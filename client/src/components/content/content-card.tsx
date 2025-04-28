import React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Pause, 
  Star, 
  Eye 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContentCardProps {
  content: {
    id: number;
    title: string;
    coverImage: string;
    type: "manga" | "novel";
    status: "ongoing" | "completed" | "hiatus";
    views: number;
    alternativeTitle?: string;
    author?: {
      name: string;
      id: number;
    };
    translationGroup?: {
      name: string;
      id: number;
    };
  };
  className?: string;
}

export function ContentCard({ content, className }: ContentCardProps) {
  const {
    id,
    title,
    coverImage,
    type,
    status,
    views,
    alternativeTitle,
    author,
    translationGroup,
  } = content;

  // Format view count
  const formatViews = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Fallback cover image
  const fallbackCover = "https://placehold.co/300x400/222222/ffffff?text=No+Image";

  return (
    <Link href={`/content/${id}`}>
      <a className={cn("block group transition-all duration-300", className)}>
        <Card className="overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary hover:shadow-sm cursor-pointer h-full">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Cover Image */}
            <div className="relative w-full pt-[140%] overflow-hidden bg-muted">
              <img
                src={coverImage || fallbackCover}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              
              <div className="absolute top-0 left-0 w-full p-2 flex justify-between">
                {/* Type Badge */}
                <Badge variant="secondary" className="text-xs font-normal">
                  {type === "manga" ? "Truyện tranh" : "Tiểu thuyết"}
                </Badge>
                
                {/* Status Badge */}
                <Badge
                  variant={
                    status === "completed"
                      ? "success"
                      : status === "ongoing"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs font-normal"
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : status === "ongoing" ? (
                    <Clock className="w-3 h-3 mr-1" />
                  ) : (
                    <Pause className="w-3 h-3 mr-1" />
                  )}
                  {status === "completed"
                    ? "Hoàn thành"
                    : status === "ongoing"
                    ? "Đang tiến hành"
                    : "Tạm ngưng"}
                </Badge>
              </div>
              
              {/* Views count */}
              <div className="absolute bottom-0 right-0 p-1.5">
                <Badge variant="secondary" className="text-xs font-normal flex items-center gap-1 opacity-80">
                  <Eye className="w-3 h-3" />
                  {formatViews(views)}
                </Badge>
              </div>
            </div>
            
            {/* Content Info */}
            <div className="p-3 flex flex-col flex-grow">
              <h3 className="font-medium text-sm truncate">{title}</h3>
              
              {alternativeTitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {alternativeTitle}
                </p>
              )}
              
              <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="truncate">
                  {author?.name && (
                    <span className="truncate">
                      {author.name}
                    </span>
                  )}
                </div>
                
                {translationGroup && (
                  <span className="truncate text-right">
                    {translationGroup.name}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}
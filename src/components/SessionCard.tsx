import { Clock, Users, Globe, Star, Zap, Pencil, Trash2, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SessionWithTutor } from "@/hooks/useSessions";

interface SessionCardProps extends SessionWithTutor {
  isTutor?: boolean;
  isBooked?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const SessionCard = ({
  id,
  theme,
  scenario,
  language,
  level,
  duration,
  price,
  tutor,
  spotsLeft,
  nextSession,
  description,
  isTutor,
  isBooked,
  onEdit,
  onDelete,
}: SessionCardProps) => {
  const navigate = useNavigate();

  const cardContent = (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary hover:shadow-xl">
      {/* Header with theme */}
      <div className="bg-preply-pink-light p-6">
        <Badge variant="secondary" className="mb-3 bg-background font-semibold">
          {theme}
        </Badge>
        <h3 className="text-xl font-bold text-foreground">{scenario}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Meta info */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>{language}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <Badge variant="outline" className="font-medium">
            {level}
          </Badge>
        </div>
        
        {/* Tutor */}
        <div className="mb-4 flex items-center gap-3">
          <img
            src={tutor.avatar}
            alt={tutor.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">{tutor.name}</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-xs text-muted-foreground">{tutor.rating} ({tutor.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
        
        {/* Next session */}
        <div className="mb-4 rounded-lg bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Next session</p>
          <p className="text-sm font-semibold text-foreground">{nextSession}</p>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-foreground">${price}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
            </div>
          </div>

          {isTutor ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/session/${id}`); }}
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(); }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button className="bg-preply-pink text-foreground hover:bg-preply-pink/90 rounded-full font-semibold gap-2">
              <Zap className="h-4 w-4 fill-current" />
              Book lesson
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isTutor) {
    return <div>{cardContent}</div>;
  }

  return (
    <Link to={`/session/${id}`} className="block">
      {cardContent}
    </Link>
  );
};

export default SessionCard;

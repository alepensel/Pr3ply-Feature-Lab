import { Clock, Users, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tutor as TutorType } from "@/data/mockData";

interface SessionCardProps {
  id: string;
  theme: string;
  scenario: string;
  language: string;
  level: string;
  duration: string;
  price: number;
  tutor: typeof TutorType;
  spotsLeft: number;
  maxSpots: number;
  nextSession: string;
  description: string;
}

const SessionCard = ({
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
}: SessionCardProps) => {
  return (
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
          <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold">
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;

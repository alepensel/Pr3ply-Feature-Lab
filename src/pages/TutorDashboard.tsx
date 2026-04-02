import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSessions, type Session } from "@/hooks/useSessions";
import Header from "@/components/Header";
import SessionCard from "@/components/SessionCard";
import SessionFormDialog from "@/components/SessionFormDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TutorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { sessions, loading, refetch } = useSessions();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingSession(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("sessions").delete().eq("id", deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast.error("Failed to delete session");
      return;
    }
    toast.success("Session deleted");
    refetch();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Filter to tutor's own sessions
  const mySessions = sessions.filter((s) => s.tutor_id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Sessions (Tutor)</h1>
            <p className="text-muted-foreground mt-2">
              Create, edit, and manage your conversation sessions
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-preply-pink text-foreground hover:bg-preply-pink/90 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>

        {mySessions.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first session to start teaching!
              </p>
              <Button onClick={handleCreate} className="bg-preply-pink text-foreground hover:bg-preply-pink/90 gap-2">
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mySessions.map((session) => (
              <SessionCard
                key={session.id}
                {...session}
                isTutor
                onEdit={() => handleEdit(session)}
                onDelete={() => setDeleteId(session.id)}
              />
            ))}
          </div>
        )}

        <SessionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          session={editingSession}
          onSaved={refetch}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this session and cannot be undone. Existing bookings will also be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default TutorDashboard;

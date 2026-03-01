import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiMegaphoneLine, RiCloseLine, RiSendPlaneLine } from "@remixicon/react";
import { setAnnouncements, addAnnouncement, removeAnnouncement } from "../../store/reducers/announcementSlice";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../../api/announcements.api";
import { useSocket } from "../../contexts/SocketContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const AnnouncementWidget = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const { announcements } = useSelector((state) => state.announcementReducer);
  const { user } = useSelector((state) => state.userReducer);
  
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    getAnnouncements()
      .then(res => dispatch(setAnnouncements(res.data)))
      .catch(() => console.error("Failed to load announcements"));
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;
    const handleNewAnnouncement = (announcement) => {
      dispatch(addAnnouncement(announcement));
      toast.info(`New Announcement: ${announcement.title}`);
    };
    socket.on('new_announcement', handleNewAnnouncement);
    return () => socket.off('new_announcement', handleNewAnnouncement);
  }, [socket, dispatch]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !content) { toast.error("Title and content are required"); return; }
    try {
      await createAnnouncement(title, content);
      setTitle(""); setContent(""); setIsCreating(false);
      toast.success("Announcement broadcasted globally!");
    } catch { toast.error("Failed to broadcast announcement"); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      dispatch(removeAnnouncement(id));
      toast.success("Announcement deleted");
    } catch { toast.error("Failed to delete announcement"); }
  };

  return (
    <Card className="border-border/40 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <RiMegaphoneLine className="text-primary h-5 w-5" />
          <CardTitle className="text-lg font-bold">Announcements</CardTitle>
        </div>
        {user?.role === "admin" && (
          <Button variant="ghost" size="sm" onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? "Cancel" : "New Broadcast"}
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isCreating && (
          <form onSubmit={handleBroadcast} className="p-3 bg-muted/30 border border-primary/20 rounded-lg space-y-3 mb-4 animate-in slide-in-from-top-2">
            <Input 
              placeholder="Announcement Title..." 
              value={title} onChange={(e) => setTitle(e.target.value)} 
              className="bg-background"
            />
            <Textarea 
              placeholder="Message content..." 
              value={content} onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] bg-background"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="bg-primary flex items-center gap-2">
                <RiSendPlaneLine size={14}/> Broadcast
              </Button>
            </div>
          </form>
        )}

        {announcements.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
            No active announcements.
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/10 transition-colors group relative">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-sm">{ann.title}</h4>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground break-words">{ann.content}</p>
              
              {user?.role === "admin" && (
                <button 
                  onClick={() => handleDelete(ann.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded transition-all"
                  title="Delete Announcement"
                >
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementWidget;

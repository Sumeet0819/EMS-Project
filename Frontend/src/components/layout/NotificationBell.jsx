import React, { useEffect, useState } from "react";
import { RiBellLine } from "@remixicon/react";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { setNotifications, markAsReadInState, markAllAsReadInState } from "../../store/reducers/notificationSlice";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../api/notifications.api";
import { useSocket } from "../../contexts/SocketContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const socket = useSocket();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useSelector((state) => state.notificationReducer);
  const { user } = useSelector((state) => state.userReducer);

  useEffect(() => {
    if (user?.id) {
      getNotifications()
        .then(res => dispatch(setNotifications(res.data)))
        .catch(err => console.error("Failed to fetch notifications", err));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      getNotifications()
        .then(res => dispatch(setNotifications(res.data)))
        .catch(() => {});
    };

    const handleTaskAssigned = (data) => {
      toast.info(`New Task: ${data.task?.title || "Assigned object"}`);
      handleUpdate();
    };

    socket.on('update_unreads', handleUpdate);
    socket.on('taskAssigned', handleTaskAssigned);
    socket.on('taskStatusChanged', (data) => {
        toast.info(data.message);
        handleUpdate();
    });

    return () => {
      socket.off('update_unreads', handleUpdate);
      socket.off('taskAssigned', handleTaskAssigned);
      socket.off('taskStatusChanged');
    };
  }, [socket, dispatch]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await markNotificationRead(id);
      dispatch(markAsReadInState(id));
      if (link) navigate(link);
      setOpen(false);
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      dispatch(markAllAsReadInState());
    } catch (err) {}
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={() => setOpen(!open)} title="Notifications">
        <RiBellLine size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button className="text-xs text-primary hover:underline" onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.link)}
                  className={`p-3 border-b border-border cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notif.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <p className={`text-sm ${!notif.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

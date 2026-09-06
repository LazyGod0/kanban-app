import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Pagination,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../lib/api";
import type { AuthUser } from "../../context/AuthContext";

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationPage = {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
};

type AccountCardProps = {
  user: AuthUser | null;
  onSignOut: () => void;
  isSigningOut: boolean;
};

function AccountCard({ user, onSignOut, isSigningOut }: AccountCardProps) {
  const [notificationAnchor, setNotificationAnchor] =
    useState<HTMLElement | null>(null);
  const [notificationPage, setNotificationPage] =
    useState<NotificationPage | null>(null);
  const [page, setPage] = useState(1);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const pendingNotifications = useRef<Notification[]>([]);
  const notificationOpen = Boolean(notificationAnchor);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const apiUrl = new URL(
      import.meta.env.VITE_API_URL ?? "http://localhost:8000",
    );
    apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    apiUrl.pathname = "/notifications/ws";
    apiUrl.search = "";

    let isActive = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;

    const connect = () => {
      if (!isActive) {
        return;
      }

      socket = new WebSocket(apiUrl.toString());
      socket.onmessage = (event) => {
        const notification = JSON.parse(event.data) as Notification;
        pendingNotifications.current = [
          notification,
          ...pendingNotifications.current.filter(
            (item) => item.id !== notification.id,
          ),
        ];
        setNotificationPage((current) => {
          if (!current) {
            return {
              items: [notification],
              page: 1,
              pageSize: 5,
              total: 1,
              unreadCount: notification.isRead ? 0 : 1,
            };
          }

          const alreadyPresent = current.items.some(
            (item) => item.id === notification.id,
          );
          if (alreadyPresent) {
            return current;
          }

          return {
            ...current,
            total: current.total + 1,
            unreadCount: current.unreadCount + (notification.isRead ? 0 : 1),
            items:
              current.page === 1
                ? [notification, ...current.items].slice(0, current.pageSize)
                : current.items,
          };
        });
      };
      socket.onclose = () => {
        if (isActive) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();
    return () => {
      isActive = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      try {
        const response = await api.get<NotificationPage>(
          "/notifications?page=1&page_size=1",
        );
        if (isMounted) {
          setNotificationPage(() => {
            const receivedWhileLoading = pendingNotifications.current;
            const responseItems = response.data.items.filter(
              (item) =>
                !receivedWhileLoading.some(
                  (received) => received.id === item.id,
                ),
            );
            const items = [...receivedWhileLoading, ...responseItems];

            return {
              ...response.data,
              items: items.slice(0, response.data.pageSize),
              total: Math.max(response.data.total, items.length),
              unreadCount: Math.max(
                response.data.unreadCount,
                items.filter((item) => !item.isRead).length,
              ),
            };
          });
        }
      } catch {}
    };

    loadUnreadCount();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadNotifications = async (nextPage: number) => {
    setIsLoadingNotifications(true);
    try {
      const response = await api.get<NotificationPage>(
        `/notifications?page=${nextPage}&page_size=5`,
      );
      setNotificationPage(response.data);
      setPage(nextPage);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleNotificationToggle = (event: React.MouseEvent<HTMLElement>) => {
    if (notificationOpen) {
      setNotificationAnchor(null);
      return;
    }

    setNotificationAnchor(event.currentTarget);
    void loadNotifications(1);
  };

  const handleNotificationRead = async (notification: Notification) => {
    if (notification.isRead) {
      return;
    }

    await api.patch(`/notifications/${notification.id}/read`);
    setNotificationPage((current) =>
      current
        ? {
            ...current,
            unreadCount: Math.max(0, current.unreadCount - 1),
            items: current.items.map((item) =>
              item.id === notification.id ? { ...item, isRead: true } : item,
            ),
          }
        : current,
    );
  };

  const handleNotificationClear = async (notificationId: string) => {
    await api.delete(`/notifications/${notificationId}`);
    setNotificationPage((current) =>
      current
        ? {
            ...current,
            total: Math.max(0, current.total - 1),
            items: current.items.filter((item) => item.id !== notificationId),
          }
        : current,
    );
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        boxShadow: "0 16px 40px rgba(53, 78, 43, 0.1)",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 3, sm: 4 },
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Your account
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800 }}
            gutterBottom
          >
            {user?.name}
          </Typography>
          <Typography color="text.secondary">{user?.email}</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Tooltip title="Notifications">
            <IconButton
              aria-label="Notifications"
              onClick={handleNotificationToggle}
              color="inherit"
            >
              <Badge
                badgeContent={notificationPage?.unreadCount ?? 0}
                color="error"
                max={99}
              >
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onSignOut}
            disabled={isSigningOut}
            sx={{ flexShrink: 0 }}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        </Stack>
      </CardContent>
      <Popover
        open={notificationOpen}
        anchorEl={notificationAnchor}
        onClose={() => setNotificationAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: { xs: 320, sm: 380 }, maxWidth: "calc(100vw - 32px)" },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        {isLoadingNotifications ? (
          <Box sx={{ display: "grid", placeItems: "center", p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notificationPage?.items.length ? (
          <List disablePadding>
            {notificationPage.items.map((notification) => (
              <ListItem
                key={notification.id}
                secondaryAction={
                  <Tooltip title="Clear notification">
                    <IconButton
                      edge="end"
                      aria-label={`Clear notification: ${notification.message}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleNotificationClear(notification.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
                sx={{
                  bgcolor: notification.isRead ? "transparent" : "action.hover",
                }}
              >
                <ListItemButton
                  onClick={() => void handleNotificationRead(notification)}
                  sx={{ alignItems: "flex-start", py: 1.5, pr: 7 }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        sx={{ fontWeight: notification.isRead ? 400 : 700 }}
                      >
                        {notification.message}
                      </Typography>
                    }
                    secondary={new Date(
                      notification.createdAt,
                    ).toLocaleString()}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            You have no notifications.
          </Typography>
        )}
        {notificationPage &&
          notificationPage.total > notificationPage.pageSize && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <Pagination
                page={page}
                count={Math.ceil(
                  notificationPage.total / notificationPage.pageSize,
                )}
                onChange={(_, nextPage) => void loadNotifications(nextPage)}
                size="small"
              />
            </Box>
          )}
      </Popover>
    </Card>
  );
}

export default AccountCard;

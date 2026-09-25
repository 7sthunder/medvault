import type { NotificationTab } from "@/shared/enums";
import type { NotifDTO } from "@/shared/types";

export interface NotificationFilterState {
  tab: NotificationTab;
  unreadOnly: boolean;
}

export interface DayGroupedNotifications {
  label: string;
  items: NotifDTO[];
}

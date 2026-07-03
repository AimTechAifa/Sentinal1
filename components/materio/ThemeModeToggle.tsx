"use client";

import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useThemeMode } from "@/context/ThemeModeContext";
import type { ThemeMode } from "@/lib/materio/theme";

type SelectableThemeMode = "light" | "dark";

const THEME_OPTIONS: SelectableThemeMode[] = ["light", "dark"];

const MODE_META: Record<SelectableThemeMode, { label: string; icon: typeof Sun; description: string }> = {
  light: { label: "Light", icon: Sun, description: "Materio light theme" },
  dark: { label: "Dark", icon: Moon, description: "Full dark mode" },
};

function selectableMode(mode: ThemeMode): SelectableThemeMode {
  return mode === "semi-dark" ? "dark" : mode;
}

export function ThemeModeToggle() {
  const { mode, setMode } = useThemeMode();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const active = selectableMode(mode);
  const CurrentIcon = MODE_META[active].icon;

  return (
    <>
      <Tooltip title={`Theme: ${MODE_META[active].label}`}>
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          size="small"
          aria-label="Change theme mode"
          sx={{
            border: 1,
            borderColor: "divider",
            width: 40,
            height: 40,
            color: "text.secondary",
            "&:hover": { bgcolor: "action.hover", color: "primary.main" },
          }}
        >
          <CurrentIcon size={18} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {THEME_OPTIONS.map((key) => {
          const { label, icon: Icon, description } = MODE_META[key];
          return (
            <MenuItem
              key={key}
              selected={active === key}
              onClick={() => {
                setMode(key);
                setAnchor(null);
              }}
            >
              <ListItemIcon>
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText primary={label} secondary={description} />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

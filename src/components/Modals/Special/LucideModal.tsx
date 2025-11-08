import React, {
    useMemo,
    useRef,
    useState,
    useEffect,
    useDeferredValue,
    useCallback,
} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Grid,
    Typography,
    Box,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { icons as LucideIconMap } from "lucide-react";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useVirtualizer } from "@tanstack/react-virtual";

export type LucideModalProps = {
    open: boolean;
    value?: string;
    onClose: () => void;
    onSelect: (iconName: string) => void;
};

const TILE_HEIGHT = 112;
const OVERSCAN_ROWS = 6;

const IconPreview = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(1.25),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    cursor: "pointer",
    rowGap: theme.spacing(1),
    "&:hover": { backgroundColor: theme.palette.action.hover },
    "&.selected": { borderColor: theme.palette.primary.main, borderWidth: 2 },
}));

export default function LucideModal({ open, value, onClose, onSelect }: LucideModalProps) {
    const theme = useTheme();
    const mdUp = useMediaQuery(theme.breakpoints.up("md"));
    const smUp = useMediaQuery(theme.breakpoints.up("sm"));

    const [searchTerm, setSearchTerm] = useState("");
    const deferredSearch = useDeferredValue(searchTerm);

    useEffect(() => {
        if (!open) setSearchTerm("");
    }, [open]);

    const allIconNames = useMemo(
        () => Object.keys(LucideIconMap) as (keyof typeof LucideIconMap)[],
        []
    );

    const filteredIcons = useMemo(() => {
        const q = deferredSearch.trim().toLowerCase();
        if (!q) return allIconNames;
        return allIconNames.filter((n) => n.toLowerCase().includes(q));
    }, [allIconNames, deferredSearch]);

    // Preserve your Grid sizes: { xs: 3, sm: 2, md: 1.5 } => columns 4 / 6 / 8
    const itemsPerRow = mdUp ? 8 : smUp ? 6 : 4;
    const rowCount = Math.ceil(filteredIcons.length / itemsPerRow);

    const scrollRef = useRef<HTMLDivElement | null>(null);

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => TILE_HEIGHT,
        overscan: OVERSCAN_ROWS,
        // Ensure we render something on first mount before measuring the element
        initialRect: { height: 400, width: 800 },
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();
    const paddingTop = virtualRows.length ? virtualRows[0]!.start : 0;
    const paddingBottom = virtualRows.length
        ? totalSize - virtualRows[virtualRows.length - 1]!.end
        : 0;

    // When search changes, make sure we are at the top and measured
    useEffect(() => {
        rowVirtualizer.scrollToIndex(0);
        rowVirtualizer.measure();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deferredSearch]);

    // Measure on open and when column count changes (breakpoints)
    useEffect(() => {
        if (!open) return;
        const el = scrollRef.current;
        // next frame: dialog/content has laid out
        const raf = requestAnimationFrame(() => {
            rowVirtualizer.scrollToIndex(0);
            rowVirtualizer.measure();
        });

        // Re-measure on container resize
        let ro: ResizeObserver | undefined;
        if (el && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => rowVirtualizer.measure());
            ro.observe(el);
        }

        return () => {
            cancelAnimationFrame(raf);
            ro?.disconnect();
        };
        // include itemsPerRow so we re-measure when breakpoints change
    }, [open, itemsPerRow, rowVirtualizer]);

    const handlePick = useCallback(
        (name: string) => {
            onSelect(name);
        },
        [onSelect]
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    width: "min(1200px, 95vw)",
                    height: "min(80vh, 900px)",
                },
            }}
        >
            <DialogTitle>Selección de iconos</DialogTitle>

            <DialogContent
                dividers
                sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
            >
                <TextField
                    fullWidth
                    placeholder="Buscar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setSearchTerm("")} edge="end">
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Scrollable area with virtualization */}
                <Box
                    ref={scrollRef}
                    sx={{ position: "relative", minHeight: 280, height: "100%", overflow: "auto" }}
                >
                    <Grid container spacing={1} sx={{ pb: 1 }}>
                        {/* top spacer */}
                        {paddingTop > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ height: paddingTop }} />
                            </Grid>
                        )}

                        {/* virtualized rows */}
                        {virtualRows.map((vr) => {
                            const rowIndex = vr.index;
                            const start = rowIndex * itemsPerRow;
                            const end = Math.min(start + itemsPerRow, filteredIcons.length);
                            const slice = filteredIcons.slice(start, end);

                            return (
                                <React.Fragment key={rowIndex}>
                                    {slice.map((iconName) => {
                                        const IconComponent = (LucideIconMap as any)[iconName];
                                        if (!IconComponent) return null;

                                        return (
                                            <Grid size={{ xs: 3, sm: 2, md: 1.5 }} key={iconName}>
                                                <IconPreview
                                                    onClick={() => handlePick(iconName)}
                                                    className={value === iconName ? "selected" : ""}
                                                    sx={{ minHeight: TILE_HEIGHT - 8 }}
                                                >
                                                    <IconComponent size={28} strokeWidth={1.75} />
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            textAlign: "center",
                                                            lineHeight: 1.25,
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                            wordBreak: "break-word",
                                                            minHeight: "2.6em",
                                                            px: 0.5,
                                                            width: "100%",
                                                        }}
                                                    >
                                                        {iconName}
                                                    </Typography>
                                                </IconPreview>
                                            </Grid>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}

                        {/* bottom spacer */}
                        {paddingBottom > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ height: paddingBottom }} />
                            </Grid>
                        )}
                    </Grid>

                    {/* Empty state */}
                    {filteredIcons.length === 0 && (
                        <Grid container spacing={1}>
                            <Grid size={{ xs: 12 }}>
                                <Typography align="center" color="text.secondary" sx={{ py: 6 }}>
                                    No se encontró ningún icono que coincida con tu búsqueda
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

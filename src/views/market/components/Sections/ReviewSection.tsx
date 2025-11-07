// src/views/market/components/Sections/ReviewSection.tsx
import { useEffect, useMemo, useState } from "react"
import {
    Box,
    Stack,
    Typography,
    Paper,
    Divider,
    Skeleton,
    Avatar,
    Rating,
    TextField,
    useTheme,
    alpha,
    Button,
    IconButton,
} from "@mui/material"
import { LoadingButton } from "@mui/lab"
import { Controller, useForm } from "react-hook-form"
import { useAuthStatus, useUser } from "../../../../context/UserContext"
import {
    useProductReviewsQuery,
    useCreateReview,
    useUpdateReview,
    useDeleteReview,
} from "../../../../queries/reviews.queries"
import { Link as RouterLink } from "react-router-dom"
import { Edit2, Save, X, Trash2 } from "lucide-react"

type Props = {
    productId: string
    avgRating?: number | null
    reviewCount?: number | null
}

export default function ReviewSection({ productId, avgRating, reviewCount }: Props) {
    const theme = useTheme()
    const { status, ready } = useAuthStatus()
    const user = useUser()
    const [page] = useState(1)
    const limit = 10

    useEffect(() => {
        console.log(user);
    }, [user])

    const { data, isLoading } = useProductReviewsQuery(productId, page, limit)
    const { mutateAsync: createReview, isPending: isCreating } = useCreateReview()
    const { mutateAsync: doDelete, isPending: isDeleting } = useDeleteReview()

    const myUserId = useMemo(() => {
        const v: any = user
        return v?._id?.toString?.() ?? v?.id?.toString?.() ?? v?.sub?.toString?.() ?? null
    }, [user])

    const reviews = data?.items ?? []
    const myReview = useMemo(
        () => reviews.find((r: any) => String(r.user?._id ?? r.userId ?? "") === String(myUserId ?? "")),
        [reviews, myUserId]
    )
    const hasMyReview = Boolean(myReview)

    const { control, handleSubmit, reset } = useForm<{ score: number; comment?: string }>({
        defaultValues: { score: 5, comment: "" },
    })

    const onSubmit = async (payload: { score: number; comment?: string }) => {
        if (hasMyReview) return
        await createReview({
            productId,
            score: Math.max(1, Math.min(5, Math.round(Number(payload.score)))),
            comment: payload.comment?.trim() || undefined,
        })
        reset({ score: 5, comment: "" })
    }

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editScore, setEditScore] = useState<number>(5)
    const [editComment, setEditComment] = useState<string>("")
    const updateMutation = useUpdateReview(editingId || "")

    const startEdit = (r: any) => {
        setEditingId(r._id)
        setEditScore(Number(r.score) || 5)
        setEditComment(r.comment || "")
    }
    const cancelEdit = () => {
        setEditingId(null)
        setEditScore(5)
        setEditComment("")
    }
    const saveEdit = async () => {
        if (!editingId) return
        await updateMutation.mutateAsync({
            score: Math.max(1, Math.min(5, Math.round(Number(editScore)))),
            comment: editComment?.trim() || undefined,
        })
        cancelEdit()
    }
    const removeReview = async (r: any) => {
        await doDelete({ id: r._id, productId: r.productId })
    }

    return (
        <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <Stack spacing={2} sx={{ mb: 4, textAlign: "center" }}>
                <Typography variant="h4" component="h2" fontWeight={800}>
                    Opiniones de Clientes
                </Typography>
                {(reviewCount ?? 0) > 0 ? (
                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                        <Rating value={Number(avgRating ?? 0)} readOnly precision={0.1} />
                        <Typography variant="body1" color="text.secondary">
                            Basado en {reviewCount} {reviewCount === 1 ? "opinión" : "opiniones"}
                        </Typography>
                    </Stack>
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        Este producto aún no tiene opiniones. ¡Sé el primero!
                    </Typography>
                )}
            </Stack>

            {status === "authenticated" ? (
                <Paper
                    sx={{
                        p: { xs: 2, md: 3 },
                        mb: 3,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: alpha(theme.palette.warning.main, 0.03),
                    }}
                >
                    <Stack spacing={1.25} sx={{ mb: 1 }}>
                        {hasMyReview && (
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.success.main, 0.06),
                                    border: `1px dashed ${alpha(theme.palette.success.main, 0.4)}`,
                                }}
                            >
                                <Typography color="success.main" sx={{ flex: 1 }}>
                                    Ya has dejado una reseña para este producto. Puedes editarla abajo.
                                </Typography>
                                {myReview && (
                                    <Button
                                        variant="outlined"
                                        color="success"
                                        onClick={() => startEdit(myReview)}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Editar mi reseña
                                    </Button>
                                )}
                            </Stack>
                        )}
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Avatar
                            alt={(user as any)?.displayName || (user as any)?.email || "User"}
                            src={(user as any)?.avatarUrl || undefined}
                            sx={{
                                bgcolor: alpha(theme.palette.warning.main, 0.15),
                                color: theme.palette.warning.dark,
                                fontWeight: 800,
                            }}
                        >
                            {((user as any)?.displayName || (user as any)?.email || "?").slice(0, 1).toUpperCase()}
                        </Avatar>

                        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ flex: 1 }}>
                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Tu valoración:
                                    </Typography>
                                    <Controller
                                        name="score"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Rating
                                                value={Number(field.value)}
                                                onChange={(_, v) => field.onChange(v ?? 5)}
                                                precision={1}
                                                size="medium"
                                                disabled={hasMyReview || isCreating || !ready}
                                            />
                                        )}
                                    />
                                </Stack>

                                <Controller
                                    name="comment"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Escribe tu reseña (opcional)"
                                            placeholder="Cuéntanos qué te gustó o qué mejorarías…"
                                            multiline
                                            minRows={3}
                                            fullWidth
                                            disabled={hasMyReview || isCreating || !ready}
                                        />
                                    )}
                                />

                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                    <LoadingButton
                                        type="submit"
                                        variant="contained"
                                        color="warning"
                                        loading={isCreating}
                                        disabled={hasMyReview || !ready}
                                        sx={{ textTransform: "none" }}
                                    >
                                        {hasMyReview ? "Ya has reseñado" : "Publicar reseña"}
                                    </LoadingButton>
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>
            ) : (
                <Paper
                    sx={{
                        p: { xs: 2, md: 3 },
                        mb: 3,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    }}
                >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
                        <Typography color="text.secondary" sx={{ flex: 1 }}>
                            Inicia sesión para dejar tu reseña.
                        </Typography>
                        <Button component={RouterLink} to="/login" variant="outlined" color="warning" sx={{ textTransform: "none" }}>
                            Iniciar sesión
                        </Button>
                    </Stack>
                </Paper>
            )}

            <Paper
                sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                }}
            >
                {isLoading ? (
                    <Stack spacing={2}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Stack key={i} spacing={1.2}>
                                <Skeleton variant="rounded" width={160} height={18} />
                                <Skeleton variant="text" />
                                <Skeleton variant="text" width="70%" />
                                <Divider sx={{ pt: 1 }} />
                            </Stack>
                        ))}
                    </Stack>
                ) : reviews.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                        No hay reseñas todavía.
                    </Typography>
                ) : (
                    <Stack divider={<Divider />} spacing={2}>
                        {reviews.map((r: any) => {
                            const date = new Date(r.createdAt)
                            const when = date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                            const displayName = r.user?.displayName || r.user?.email || "Usuario"
                            const avatarSrc = r.user?.avatarUrl || undefined
                            const initial = (r.user?.displayName || r.user?.email || "U").slice(0, 1).toUpperCase()
                            const subId = r.user?.email ? r.user.email : `#${String(r.userId).slice(0, 6)}`
                            const ownerId = String(r.user?._id ?? r.userId ?? "")
                            const mine = myUserId && ownerId === String(myUserId)

                            return (
                                <Stack key={r._id} spacing={1.1}>
                                    <Stack direction="row" alignItems="center" spacing={1.2}>
                                        <Avatar
                                            src={avatarSrc}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: alpha(theme.palette.warning.main, 0.15),
                                                color: theme.palette.warning.dark,
                                                fontSize: 14,
                                                fontWeight: 800,
                                            }}
                                        >
                                            {initial}
                                        </Avatar>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {displayName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {subId}
                                        </Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ mr: mine ? 1 : 0 }}>
                                            {when}
                                        </Typography>
                                        {mine && editingId !== r._id && (
                                            <>
                                                <IconButton size="small" onClick={() => startEdit(r)}>
                                                    <Edit2 size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    disabled={isDeleting}
                                                    onClick={() => removeReview(r)}
                                                >
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </>
                                        )}
                                    </Stack>

                                    {editingId === r._id ? (
                                        <Stack spacing={1.25}>
                                            <Stack direction="row" spacing={1.25} alignItems="center">
                                                <Rating
                                                    value={Number(editScore)}
                                                    onChange={(_, v) => setEditScore(v ?? 5)}
                                                    precision={1}
                                                    size="small"
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    {Number(editScore)}/5
                                                </Typography>
                                            </Stack>
                                            <TextField
                                                value={editComment}
                                                onChange={(e) => setEditComment(e.target.value)}
                                                multiline
                                                minRows={2}
                                                fullWidth
                                            />
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button
                                                    variant="text"
                                                    startIcon={<X size={16} />}
                                                    onClick={cancelEdit}
                                                    sx={{ textTransform: "none" }}
                                                >
                                                    Cancelar
                                                </Button>
                                                <LoadingButton
                                                    variant="contained"
                                                    startIcon={<Save size={16} />}
                                                    loading={updateMutation.isPending}
                                                    onClick={saveEdit}
                                                    sx={{ textTransform: "none" }}
                                                >
                                                    Guardar
                                                </LoadingButton>
                                            </Stack>
                                        </Stack>
                                    ) : (
                                        <>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Rating value={Number(r.score)} readOnly size="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {Number(r.score)}/5
                                                </Typography>
                                            </Stack>

                                            {r.comment && (
                                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                                    {r.comment}
                                                </Typography>
                                            )}
                                        </>
                                    )}
                                </Stack>
                            )
                        })}
                    </Stack>
                )}
            </Paper>
        </Box>
    )
}

"use client";

import {
  Box,
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
} from "@mui/material";
import {
  UploadFile,
  Description,
  MoreVert,
  Delete,
  Visibility,
  Download,
  ViewModule,
  ViewList,
} from "@mui/icons-material";
import { useState } from "react";
import { useDocuments, type DocumentItem } from "@/hooks/useDocuments";
import { useToast } from "@/hooks/useToast";
import DocumentStatus from "./DocumentStatus";

export default function DocumentsStack() {
  const { toast } = useToast();
  const { documents, isLoading, upload, deleteDocument } = useDocuments();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFileUpload = (files: FileList) => {
    upload.mutate(files, {
      onSuccess: () => {
        toast({
          severity: "success",
          title: "Documents",
          description: "Documents uploaded successfully",
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        toast({
          severity: "error",
          title: "Documents",
          description: err.message ?? "Upload failed",
        });
      },
    });
  };

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Documents
          </Typography>
          <Typography color="text.secondary">
            Manage your uploaded documents
          </Typography>
        </Box>

        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFile />}
          disabled={upload.isPending}
        >
          Upload
          <input
            hidden
            multiple
            type="file"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </Button>
      </Stack>

      {/* Controls */}
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          placeholder="Search documents"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
        >
          <ToggleButton value="grid">
            <ViewModule />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewList />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Content */}
      {isLoading ? (
        <Box textAlign="center" py={6}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary">No documents found</Typography>
      ) : view === "grid" ? (
        <Grid container spacing={3}>
          {filtered.map((doc) => (
            <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between">
                      <Description color="primary" />
                      <IconButton
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setSelectedDoc(doc);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Stack>

                    <Typography fontWeight={500} noWrap>
                      {doc.name}
                    </Typography>

                    <DocumentStatus doc={doc} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Stack spacing={2}>
          {filtered.map((doc) => (
            <Card key={doc.id}>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack>
                    <Typography fontWeight={500}>{doc.name}</Typography>
                    <DocumentStatus doc={doc} />
                  </Stack>

                  <IconButton
                    onClick={(e) => {
                      setMenuAnchor(e.currentTarget);
                      setSelectedDoc(doc);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View
        </MenuItem>
        <MenuItem>
          <Download fontSize="small" sx={{ mr: 1 }} /> Download
        </MenuItem>
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            setConfirmDelete(true);
            setMenuAnchor(null);
          }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{selectedDoc?.name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (!selectedDoc) return;
              deleteDocument.mutate(selectedDoc.id);
              setConfirmDelete(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

import { z } from "zod";

export const createLocalFolderFormSchema = z.object({
    folderName: z
        .string()
        .trim()
        .min(1, { message: "Folder name is required" })
        .max(100, { message: "Folder name must be 100 characters or less" }),
    folderIconColor: z.string().min(1, "Please select a color"),
    folderId: z.string().optional(),
    isEdit: z.boolean().optional(),
});

export type CreateLocalFolderFormValues = z.infer<typeof createLocalFolderFormSchema>;

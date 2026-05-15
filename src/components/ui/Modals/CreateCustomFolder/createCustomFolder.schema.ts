import { z } from "zod";

export const createCustomFolderFormSchema = z.object({
    folderName: z.string().min(1, { message: "Folder name is required" }),
    folderIconColor: z.string().min(1, "Please select a color"),
    parentFolder: z.string().optional(),
    editFolderId: z.string().optional(),
    isEdit: z.boolean().optional(),
});

export type CreateCustomFolderFormValues =
    z.infer<typeof createCustomFolderFormSchema>;

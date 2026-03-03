# Multer

## Basic Setup

```typescript
import express from "express";
import multer from "multer";

const app = express();

// Simple setup with destination directory
const upload = multer({ dest: "uploads/" });
```

---

## Storage Engines

### Disk Storage

```typescript
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = file.originalname.split(".").pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});

const upload = multer({ storage });
```

### Memory Storage

```typescript
// Files stored as Buffer in memory (for S3, processing, etc.)
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.single("file"), (req, res) => {
  const buffer = req.file!.buffer;
  const mimetype = req.file!.mimetype;
  // Process buffer or upload to cloud storage
});
```

---

## Upload Methods

### Single File

```typescript
app.post("/avatar", upload.single("avatar"), (req, res) => {
  // req.file contains the uploaded file
  const { filename, mimetype, size, path } = req.file!;
  res.json({ filename, mimetype, size });
});
```

### Multiple Files (Same Field)

```typescript
app.post("/photos", upload.array("photos", 12), (req, res) => {
  // req.files is an array of files
  const files = req.files as Express.Multer.File[];
  res.json({ count: files.length });
});
```

### Multiple Fields

```typescript
const uploadFields = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "gallery", maxCount: 8 },
]);

app.post("/profile", uploadFields, (req, res) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const avatar = files["avatar"]?.[0];
  const gallery = files["gallery"] || [];

  res.json({
    avatar: avatar?.filename,
    galleryCount: gallery.length,
  });
});
```

### No Files (Text Only)

```typescript
app.post("/text-only", upload.none(), (req, res) => {
  // req.body contains text fields only
  res.json(req.body);
});
```

---

## File Filtering

```typescript
const imageFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images allowed.`));
  }
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
});

// Document filter example
const documentFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and Word documents are allowed."));
  }
};
```

---

## Limits

```typescript
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max file size
    files: 10,                   // Max 10 files per request
    fields: 20,                  // Max 20 non-file fields
    fieldNameSize: 100,          // Max field name length
    fieldSize: 1024 * 1024,      // Max field value size (1MB)
  },
});
```

---

## Error Handling

```typescript
app.post("/upload", (req, res, next) => {
  const singleUpload = upload.single("file");

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific error
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          return res.status(400).json({ error: "File too large" });
        case "LIMIT_FILE_COUNT":
          return res.status(400).json({ error: "Too many files" });
        case "LIMIT_UNEXPECTED_FILE":
          return res.status(400).json({ error: "Unexpected field name" });
        default:
          return res.status(400).json({ error: err.message });
      }
    } else if (err) {
      // Custom filter error or other error
      return res.status(400).json({ error: err.message });
    }

    // Success
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    res.json({ filename: req.file.filename });
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message, code: err.code });
  }
  next(err);
});
```

---

## TypeScript Typing

```typescript
import { Request } from "express";

// Extend Request type for single file
interface FileRequest extends Request {
  file: Express.Multer.File;
}

// Extend Request type for multiple files
interface FilesRequest extends Request {
  files: {
    [fieldname: string]: Express.Multer.File[];
  };
}

// File object shape
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;    // disk storage only
  filename: string;       // disk storage only
  path: string;           // disk storage only
  buffer: Buffer;         // memory storage only
}
```

---

## S3 Integration Pattern

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  const key = `uploads/${Date.now()}-${req.file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }),
  );

  const url = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
  res.json({ url, key });
});
```

---

## NestJS Integration

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("files")
export class FilesController {
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: "image/*" }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return { filename: file.filename, size: file.size };
  }

  @Post("photos")
  @UseInterceptors(FilesInterceptor("photos", 10))
  uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    return { count: files.length };
  }
}
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| No file size limit | Memory exhaustion, disk filling up | Always set `limits.fileSize` |
| No file type validation | Users upload executable or malicious files | Use `fileFilter` to whitelist MIME types |
| Using `originalname` as filename | Path traversal attacks, collisions | Generate unique filenames with timestamp/UUID |
| Disk storage for cloud deployment | Ephemeral filesystem loses files | Use memory storage + cloud upload (S3) |
| No error handling middleware | Multer errors crash the app | Handle `MulterError` explicitly |
| Trusting client MIME type blindly | MIME type can be spoofed | Verify file content with magic bytes |
| Not cleaning up failed uploads | Orphan files accumulate on disk | Delete files on processing failure |
| Memory storage for large files | OOM errors with large uploads | Use disk storage or streaming for large files |

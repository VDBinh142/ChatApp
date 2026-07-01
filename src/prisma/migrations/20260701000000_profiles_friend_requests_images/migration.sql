-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable: Image (must exist before User/Group reference it)
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "basePath" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_imageName_key" ON "Image"("imageName");

-- AlterTable: User - add profile fields
ALTER TABLE "User"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "avatarImageId" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_avatarImageId_key" ON "User"("avatarImageId");

-- AlterTable: Friendship - add createdAt
ALTER TABLE "Friendship"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Group - add iconImageId
ALTER TABLE "Group"
  ADD COLUMN "iconImageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Group_iconImageId_key" ON "Group"("iconImageId");

-- CreateTable: FriendRequest
CREATE TABLE "FriendRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarImageId_fkey" FOREIGN KEY ("avatarImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_iconImageId_fkey" FOREIGN KEY ("iconImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

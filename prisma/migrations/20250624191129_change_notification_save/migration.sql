-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_boardId_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "boardTitle" TEXT;

import cron from 'node-cron';
import { StudentModel } from '../models/Studentmodel.js';

console.log("Cron Job Started");

export default cron.schedule('*/30 * * * *', async () => {
    try {
        await StudentModel.updateMany(
            { "hearts": { "$lt": 5 } },
            { "$inc": { "hearts": 1 } }
        );
        console.log("Cron Updated");
    } catch (error) {
        console.error("Error updating students:", error);
    }
});
import mongoose from "mongoose";
import xlsx from "xlsx";
import path from "path";
import dotenv from "dotenv";
import Report from "./src/models/Report"; 

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/wai-flood";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const filePath = path.resolve(__dirname, "../frontend/public/data_maret/Laporan Banjir Maret.xlsx");
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    console.log(`Found ${data.length} records. Processing...`);

    const reportsToInsert = data.map((row) => ({
      title: `Laporan Banjir - ${row["Nama Pelapor"] || "Anonim"}`,
      description: row["Deskripsi kejadian_1"] || "Laporan kejadian banjir",
      severity: Number(row["Perkiraan kedalaman banjir (cm)"]) || 0,
      status: "approved",
      location: {
        type: "Point",
        coordinates: [
          Number(row["_lokasi koordinat_longitude"]) || 0,
          Number(row["_lokasi koordinat_latitude"]) || 0
        ]
      },
      gps_accuracy: Number(row["_lokasi koordinat_precision"]) || 0,
      reporterName: row["Nama Pelapor"] || "Anonim",
      reporterContact: row["username"] && row["username"] !== "username not found" ? row["username"] : "",
      imageUrl: row["foto banjir"] || "",
      createdAt: row.start ? new Date(row.start) : new Date(),
      updatedAt: row.start ? new Date(row.start) : new Date(),
    }));

    const validReports = reportsToInsert.filter(
      (r) => r.location.coordinates[0] >= -180 && r.location.coordinates[0] <= 180 && 
             r.location.coordinates[1] >= -90 && r.location.coordinates[1] <= 90
    );

    console.log(`Inserting ${validReports.length} valid reports out of ${data.length}...`);
    
    await Report.insertMany(validReports);
    
    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();

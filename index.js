import express from "express";
import bodyParser from "body-parser";
import mljs from "mljs";
import fs from "fs";
import path from "path";
import _ from "lodash";
import csvParser from "csv-parser";
import excel from "exceljs";
import * as mathjs from "mathjs";
import { PythonShell } from "python-shell";

const { SARIMA } = mljs;
const app = express();
const PORT = 3044;

// app.use(express.json());

// Middleware
app.use(bodyParser.json());

// Endpoint to forecast using SARIMA
// Read CSV file
const readCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    let data = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", (err) => reject(err));
  });
};

// Read Excel file
const readExcelFile = async (filePath) => {
  const workbook = new excel.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  let data = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rowData = {};
    row.eachCell((cell, colNumber) => {
      rowData[worksheet.getColumn(colNumber).header] = cell.value;
    });
    data.push(rowData);
  });

  return data;
};
function readData(filePath) {
  return new Promise((resolve, reject) => {
    let data = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", reject);
  });
}

// Forecast API Endpoint
app.post("/forecast", async (req, res) => {
  const csvData = await readData("preprocessed_data.csv");

  // // Setting the index and ensuring it's a datetime index
  // let series = csvData.set_index("date").resample("D").mean().ffill();

  // Model setup
  // let model = new SARIMA(csvData, {
  //   p: 1,
  //   d: 1,
  //   q: 1,
  //   P: 1,
  //   D: 1,
  //   Q: 1,
  //   s: 12,
  // });
  // let result = model.fit();

  // // Forecasting
  // let specificDate = pd.to_datetime(specific_date); // You can change this date
  // let forecastValue = result.get_forecast((steps = 1)).predicted_mean[
  //   specificDate
  // ];
  const { targetColumn, forecastDate, exogenousColumns } = req.body;

  if (!targetColumn || !forecastDate || !exogenousColumns) {
    return res.status(400).json({ error: "Missing required inputs" });
  }

  const inputArgs = {
    file_path: path.resolve("preprocessed_data.csv"),
    target_column: targetColumn,
    forecast_date: forecastDate,
    exogenous_columns: exogenousColumns,
  };

  // Call Python script for prediction
  PythonShell.run(
    "sarima.py",
    { args: [JSON.stringify(inputArgs)] },
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to process prediction" });
      }

      // Send prediction back
      res.json({ prediction: parseFloat(results[0]) });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

import pandas as pd
import sys
from statsmodels.tsa.statespace.sarimax import SARIMAX

# Function to load data and preprocess
def load_data(file_path):
    data = pd.read_csv(file_path)
    data["date"] = pd.to_datetime(data["date"])
    data.set_index("date", inplace=True)
    return data

# Train SARIMAX and make predictions
def predict_pollutants(data, exogenous_columns, target_column, forecast_date):
    # Ensure data is sorted by date
    data = data.sort_index()

    # Extract training data
    exogenous_data = data[exogenous_columns]
    target_data = data[target_column]

    # Fit SARIMAX model
    model = SARIMAX(target_data, exog=exogenous_data, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
    results = model.fit(disp=False)

    # Prepare exogenous data for prediction
    forecast_index = pd.to_datetime([forecast_date])
    future_exog = pd.DataFrame(data={
        col: [data[col].iloc[-1]] for col in exogenous_columns
    }, index=forecast_index)

    # Predict
    forecast = results.get_forecast(steps=1, exog=future_exog)
    predicted_mean = forecast.predicted_mean.iloc[0]

    return predicted_mean

if __name__ == "__main__":
    # Arguments from Node.js
    input_args = eval(sys.argv[1])
    file_path = input_args["file_path"]
    target_column = input_args["target_column"]
    forecast_date = input_args["forecast_date"]
    exogenous_columns = input_args["exogenous_columns"]

    # Load data and make prediction
    data = load_data(file_path)
    prediction = predict_pollutants(data, exogenous_columns, target_column, forecast_date)

    # Output the prediction
    print(prediction)

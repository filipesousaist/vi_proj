import pandas as pd

data_df = pd.read_csv("data/thecure_discography.csv", delimiter = ",")

#data_df.drop(["text", "wiki_name", "word_count"], axis = 1, inplace = True)
data_df = data_df[["album_name", "track_name", "danceability"]]

data_df.dropna(inplace=True)

#firstPair = data_df.drop("danceability", axis = 1)
firstPair = data_df.groupby(by = ["album_name", "track_name"], as_index = False).sum()

firstPair.rename({"album_name": "parent", "track_name": "child"}, axis = 1, inplace = True)

parents_list = firstPair["parent"].unique()

for parent in parents_list:
    firstPair = firstPair.append({"child": parent, "parent": "root"}, ignore_index = True)

firstPair = firstPair.append({"child": "root"}, ignore_index=True)

#firstPair = firstPair.append(secondPair)

for i in range(len(firstPair)):
    if (firstPair.at[i, "parent"] == firstPair.at[i, "child"]):
        firstPair.at[i, "child"] = firstPair.at[i, "child"] + " "

firstPair.to_csv("data/h_data.csv", index=False)
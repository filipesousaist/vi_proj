from os import listdir
import pandas as pd

def main():
    #mergePlayerCountHistory()
    mergePlayerCountHistory_p()


def mergePlayerCountHistory():
    folder = "../data/PlayerCountHistory/"
    newDf = pd.DataFrame([], columns = ["appid", "Year", "Month", "mean", "max"])

    filenames = listdir(folder)
    l = len(filenames)

    for i in range(l):
        filename = filenames[i]
        file = pd.read_csv(folder + filename, sep=",", encoding="ansi")
        file["appid"] = filename[:-4]
        newDf = newDf.append(file)

        print(i / l * 100, end="\r")


    newDf.to_csv("../data/playerCountHistory.csv", header=True, index=False)

def mergePlayerCountHistory_p():
    folder = "../data/PlayerCountHistory_p/"
    newDf = pd.DataFrame([], columns = ["pid", "Year", "Month", "mean", "max"])

    filenames = listdir(folder)
    l = len(filenames)

    for i in range(l):
        filename = filenames[i]
        file = pd.read_csv(folder + filename, sep=",", encoding="ansi")
        file["pid"] = filename[:-4]
        newDf = newDf.append(file)

        print(i / l * 100, end="\r")


    newDf.to_csv("../data/playerCountHistory_p.csv", header=True, index=False)




if __name__ == '__main__':
    main()

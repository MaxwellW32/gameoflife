"use client"
import React, { useRef } from 'react'
import { v4 } from 'uuid'
import styles from "./page.module.css"

type tileType = {
    id: string,
    rowIndex: number,
    columnIndex: number,
    type: "white" | "black",
    element: HTMLDivElement
}

type tileTypeAtIndexType = "black" | "white" | "grey"

type moveActionType =
    | "UP"
    | "DOWN"
    | "LEFT"
    | "RIGHT"
    | "UP_2"
    | "DOWN_2"
    | "LEFT_2"
    | "RIGHT_2"

const tileRules: { [key: string]: moveActionType } = {
    "grey_grey_grey_grey_grey_grey_grey_grey": "RIGHT",
    "black_grey_grey_grey_grey_grey_grey_black": "DOWN",
    "white_white_grey_grey_grey_grey_white_white": "UP",
    "black_black_black_grey_grey_grey_grey_grey": "RIGHT_2",
    "grey_grey_grey_black_black_grey_grey_grey": "LEFT",
}

//tile can move - 8 directions - row/column increase/stay
//check tiles around

export default function Home() {
    const tileSize = 40
    const tileCount = 10

    const tileContRef = useRef<HTMLDivElement | null>(null)
    const tiles = useRef<tileType[]>([])

    function generateTiles() {
        if (tileContRef === null) return

        const rowColumnIndexObj: { [key: string]: boolean } = {}

        //x index row

        //map all positions
        for (let indexRow = 0; indexRow < tileCount; indexRow++) {//x
            for (let indexColumn = 0; indexColumn < tileCount; indexColumn++) {//y
                rowColumnIndexObj[`${indexRow}_${indexColumn}`] = false
            }
        }

        //update with tiles on canvas
        tiles.current.map(eachTile => {
            rowColumnIndexObj[`${eachTile.rowIndex}_${eachTile.columnIndex}`] = true
        })

        const amt = Math.floor((tileCount * tileCount) / 10)

        for (let index = 0; index < amt; index++) {
            const availableRowColumnIndexObjKeys = Object.entries(rowColumnIndexObj).filter(eachEntry => !eachEntry[1]).map(eachEntry => eachEntry[0])
            if (availableRowColumnIndexObjKeys.length === 0) {
                break
            }

            const randomRowColumn = availableRowColumnIndexObjKeys[Math.floor(Math.random() * availableRowColumnIndexObjKeys.length)]
            const [randomRow, randomColumn] = randomRowColumn.split("_").map(each => parseInt(each))

            //mark as used position from xyIndexObj
            rowColumnIndexObj[randomRowColumn] = true

            const newTileId = v4()
            const newTileType = Math.random() > 0.005 ? "black" : "white"

            const newElement = document.createElement("div")
            //styling
            newElement.id = newTileId
            newElement.classList.add(styles.tile)
            newElement.style.width = `${tileSize}px`
            newElement.style.height = `${tileSize}px`
            newElement.style.top = `${randomRow * tileSize}px`
            newElement.style.left = `${randomColumn * tileSize}px`
            newElement.style.backgroundColor = newTileType === "black" ? "#000" : "#fff"

            const newTile: tileType = {
                id: newTileId,
                rowIndex: randomRow,
                columnIndex: randomColumn,
                type: newTileType,
                element: newElement
            }

            tiles.current.push(newTile)
            tileContRef.current!.appendChild(newTile.element)
        }

        console.log(`$xyIndexObj`, rowColumnIndexObj);
    }

    function runTileLoop() {
        tiles.current.forEach((eachTile) => {
            const seen8PointCoordsString = get8PointCoordinates(eachTile).join("_")

            const action: moveActionType | undefined = tileRules[seen8PointCoordsString]
            if (action === undefined) return

            switch (action) {
                case "UP":
                    eachTile.rowIndex = ensureInBounds("row", eachTile.rowIndex - 1)
                    break

                case "DOWN":
                    eachTile.rowIndex = ensureInBounds("row", eachTile.rowIndex + 1)
                    break

                case "LEFT":
                    eachTile.columnIndex = ensureInBounds("column", eachTile.columnIndex - 1)
                    break

                case "RIGHT":
                    eachTile.columnIndex = ensureInBounds("column", eachTile.columnIndex + 1)
                    break

                case "UP_2":
                    eachTile.rowIndex = ensureInBounds("row", eachTile.rowIndex - 2)
                    break

                case "DOWN_2":
                    eachTile.rowIndex = ensureInBounds("row", eachTile.rowIndex + 2)
                    break

                case "LEFT_2":
                    eachTile.columnIndex = ensureInBounds("column", eachTile.columnIndex - 2)
                    break

                case "RIGHT_2":
                    eachTile.columnIndex = ensureInBounds("column", eachTile.columnIndex + 2)
                    break
            }

            //show update
            updateTilePosOnDom(eachTile)
        })

        setTimeout(() => {
            runTileLoop()
        }, 1000);
    }

    function get8PointCoordinates(tile: tileType) {
        //return black/white/grey
        const tileTypeAtIndexArr: tileTypeAtIndexType[] = ["grey", "grey", "grey", "grey", "grey", "grey", "grey", "grey"]

        for (let index = 0; index < 8; index++) {
            let currentRowIndex = tile.rowIndex
            let currentColumnIndex = tile.columnIndex

            if (index === 0) {
                currentRowIndex -= 1
                currentColumnIndex -= 1

            } else if (index === 1) {
                currentRowIndex -= 1

            } else if (index === 2) {
                currentRowIndex -= 1
                currentColumnIndex += 1

            } else if (index === 3) {
                currentColumnIndex -= 1

            } else if (index === 4) {
                currentColumnIndex += 1

            } else if (index === 5) {
                currentRowIndex += 1
                currentColumnIndex -= 1

            } else if (index === 6) {
                currentRowIndex += 1

            } else if (index === 7) {
                currentRowIndex += 1
                currentColumnIndex += 1
            }

            const foundAdjTile = tiles.current.find(eachTile => ((eachTile.rowIndex === currentRowIndex) && (eachTile.columnIndex === currentColumnIndex)))
            if (foundAdjTile !== undefined) {
                tileTypeAtIndexArr[index] = foundAdjTile.type
            }
        }

        return tileTypeAtIndexArr
    }

    function ensureInBounds(option: "row" | "column", newIndex: number) {
        if (option === "row") {
            if (newIndex > tileCount - 1) {
                newIndex = newIndex % (tileCount - 1) - 1
            }
        } else {
            //column
            if (newIndex > tileCount - 1) {
                newIndex = newIndex % (tileCount - 1) - 1
            }
        }

        return newIndex
    }

    function updateTilePosOnDom(tile: tileType) {
        tile.element.style.top = `${tile.rowIndex * tileSize}px`
        tile.element.style.left = `${tile.columnIndex * tileSize}px`
    }

    return (
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", overflow: "auto" }}>
            <div>
                <h1>Game Of Life</h1>

                <div className='simpleFlex'>
                    <button className='button2'
                        onClick={generateTiles}
                    >generate</button>

                    <button className='button2'
                        onClick={runTileLoop}
                    >Start</button>
                </div>
            </div>

            <div style={{ display: "grid", overflow: "auto" }}>
                <div ref={tileContRef} className={styles.tileCont} style={{ width: `${tileSize * tileCount}px`, height: `${tileSize * tileCount}px`, position: "relative", "--tileWidth": `${tileSize}px`, "--tileHeight": `${tileSize}px` } as React.CSSProperties}>
                    {new Array(tileCount).fill("").map((eachRow, eachRowIndex) => {//grey tiles
                        return (
                            <React.Fragment key={eachRowIndex}>
                                {new Array(tileCount).fill("").map((eachColumn, eachColumnIndex) => {
                                    return (
                                        <div key={eachColumnIndex} className={`${styles.tile} ${styles.grayTile}`} style={{ top: `${eachColumnIndex * tileSize}px`, left: `${eachRowIndex * tileSize}px` }}>
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
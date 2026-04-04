"use client"
import React, { useEffect, useRef } from 'react'
import { v4 } from 'uuid'
import styles from "./page.module.css"
import { deepClone } from '@/utility/utility'

type tileType = {
    id: string,
    rowIndex: number,
    columnIndex: number,
    type: "white" | "black",
    element: HTMLDivElement
}

type tileTypeAtIndexType = "black" | "white" | "grey"

type tileRowColumnIndexObjType = { [key: string]: Pick<tileType, "type"> | null }

type moveActionType =
    | "up"
    | "down"
    | "left"
    | "right"

const tileRules: { [key: string]: moveActionType[] } = {
    "grey_grey_grey_grey_grey_grey_grey_grey": ["right", "down"],
}

export default function Home() {
    const tileSize = 40
    const tileCount = 100

    const tileContRef = useRef<HTMLDivElement | null>(null)
    const tiles = useRef<tileType[]>([])
    const tileRowColumnIndexObj = useRef<tileRowColumnIndexObjType>({})

    const mounted = useRef(false)

    //start off tileRowColumnIndexObj
    useEffect(() => {
        //map all positions
        clearTileRowColumnIndexObj()

    }, [])

    //start off loop
    useEffect(() => {
        if (mounted.current) return
        mounted.current = true

        //run loop
        // runTileLoop()

    }, [])

    function generateTiles() {
        if (tileContRef.current === null) return

        const amtToMake = Math.floor((tileCount * tileCount) / 10)

        for (let index = 0; index < amtToMake; index++) {
            const availableTileRowColumnIndexObjKeys = Object.entries(tileRowColumnIndexObj.current).filter(eachEntry => eachEntry[1] === null).map(eachEntry => eachEntry[0])
            if (availableTileRowColumnIndexObjKeys.length === 0) {
                break
            }

            const randomRowColumnStr = availableTileRowColumnIndexObjKeys[Math.floor(Math.random() * availableTileRowColumnIndexObjKeys.length)]
            const [randomRow, randomColumn] = randomRowColumnStr.split("_").map(each => parseInt(each))

            const newTile = makeNewTile(randomRow, randomColumn)

            tiles.current.push(newTile)
            tileContRef.current.appendChild(newTile.element)

            //add onto tileRowColumnIndexObj
            tileRowColumnIndexObj.current[`${newTile.rowIndex}_${newTile.columnIndex}`] = { type: newTile.type }
        }
    }

    function makeTileAtRowColumnIndex(rowIndex: number, columnIndex: number) {
        if (tileContRef.current === null) return
        if (tileRowColumnIndexObj.current[`${rowIndex}_${columnIndex}`] !== null) return

        const newTile = makeNewTile(rowIndex, columnIndex)
        console.log(`$newTile`, newTile);

        tiles.current.push(newTile)
        tileContRef.current.appendChild(newTile.element)

        //add onto tileRowColumnIndexObj
        tileRowColumnIndexObj.current[`${newTile.rowIndex}_${newTile.columnIndex}`] = { type: newTile.type }
    }

    function makeNewTile(rowIndex: number, columnIndex: number) {
        const newTileId = v4()
        const newTileType = Math.random() > 0.005 ? "black" : "white"

        const newElement = document.createElement("div")
        //styling
        newElement.id = newTileId
        newElement.classList.add(styles.tile)
        newElement.style.top = `${rowIndex * tileSize}px`
        newElement.style.left = `${columnIndex * tileSize}px`
        newElement.style.backgroundColor = newTileType === "black" ? "#000" : "#fff"

        const newTile: tileType = {
            id: newTileId,
            rowIndex: rowIndex,
            columnIndex: columnIndex,
            type: newTileType,
            element: newElement
        }

        return newTile
    }

    function runTileLoop() {
        const staticTileRowColumnIndexObj = deepClone(tileRowColumnIndexObj.current)

        const startingTilePositions: { [key: string]: { startingRowIndex: number, startingColumnIndex: number } } = {}

        //for each tile
        for (let index = 0; index < tiles.current.length; index++) {
            const eachTile = tiles.current[index];

            //add onto startingTilePositions
            startingTilePositions[eachTile.id] = { startingRowIndex: eachTile.rowIndex, startingColumnIndex: eachTile.columnIndex }

            const seen8PointCoordsString = get8PointCoordinates(eachTile, staticTileRowColumnIndexObj).join("_")

            let actions: moveActionType[] | undefined = tileRules[seen8PointCoordsString]
            if (actions === undefined) {
                const newRules = generateUniqueRandomTileRules()

                tileRules[seen8PointCoordsString] = newRules
                actions = tileRules[seen8PointCoordsString]

                console.log(`$moveset for ${seen8PointCoordsString} undefined - creating new movements`, actions);
                console.log(`$tileRules`, tileRules);
            }

            actions.forEach(eachAction => {
                if (eachAction === "up") {
                    eachTile.rowIndex = ensureInBounds(eachTile.rowIndex - 1)

                } else if (eachAction === "down") {
                    eachTile.rowIndex = ensureInBounds(eachTile.rowIndex + 1)

                } else if (eachAction === "left") {
                    eachTile.columnIndex = ensureInBounds(eachTile.columnIndex - 1)

                } else if (eachAction === "right") {
                    eachTile.columnIndex = ensureInBounds(eachTile.columnIndex + 1)
                }
            })
        }

        //handle showing movements
        tiles.current.map(eachTile => {
            const tileSharingPos = tiles.current.find(eachTileFind => ((eachTileFind.id !== eachTile.id) && (eachTileFind.rowIndex === eachTile.rowIndex) && (eachTileFind.columnIndex === eachTile.columnIndex)))
            if (tileSharingPos !== undefined) {
                console.log(`$eachtile`, eachTile);
                console.log(`$sharing position with`, tileSharingPos);
                console.log(`$so reset`);

                //tile sharing position with another - cancel transformation
                eachTile.rowIndex = startingTilePositions[eachTile.id].startingRowIndex
                eachTile.columnIndex = startingTilePositions[eachTile.id].startingColumnIndex
            }
        })

        //show update
        for (let index = 0; index < tiles.current.length; index++) {
            const eachTile = tiles.current[index];

            updateTilePosOnDom(eachTile)
        }

        //reset and update tileRowColumnIndexObj with tiles
        clearTileRowColumnIndexObj()
        for (let index = 0; index < tiles.current.length; index++) {
            const eachTile = tiles.current[index];

            tileRowColumnIndexObj.current[`${eachTile.rowIndex}_${eachTile.columnIndex}`] = { type: eachTile.type }
        }

        setTimeout(() => {
            runTileLoop()
        }, 1000);
    }

    function get8PointCoordinates(tile: tileType, seenTileRowColumnIndexObj: tileRowColumnIndexObjType) {
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

            const foundAdjTile = seenTileRowColumnIndexObj[`${currentRowIndex}_${currentColumnIndex}`]
            if (foundAdjTile !== undefined && foundAdjTile !== null) {
                tileTypeAtIndexArr[index] = foundAdjTile.type
            }
        }

        return tileTypeAtIndexArr
    }

    function ensureInBounds(newIndex: number) {
        if (newIndex > tileCount - 1) {
            newIndex = 0

        } else if (newIndex < 0) {
            newIndex = tileCount - 1
        }

        return newIndex
    }

    function updateTilePosOnDom(tile: tileType) {
        tile.element.style.top = `${tile.rowIndex * tileSize}px`
        tile.element.style.left = `${tile.columnIndex * tileSize}px`
    }

    function generateUniqueRandomTileRules() {
        const moveOptions: moveActionType[] = ["up", "down", "left", "right"]

        const moveCount = Math.floor(Math.random() * 3) + 1

        const newMovements = Array.from({ length: moveCount }, () =>
            moveOptions[Math.floor(Math.random() * moveOptions.length)]
        )

        return newMovements
    }

    function clearTileRowColumnIndexObj() {
        for (let indexRow = 0; indexRow < tileCount; indexRow++) {//x
            for (let indexColumn = 0; indexColumn < tileCount; indexColumn++) {//y
                tileRowColumnIndexObj.current[`${indexRow}_${indexColumn}`] = null
            }
        }
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
                    >start</button>
                </div>
            </div>

            <div style={{ display: "grid", overflow: "auto" }}>
                <div ref={tileContRef} className={styles.tileCont} style={{ width: `${tileSize * tileCount}px`, height: `${tileSize * tileCount}px`, position: "relative", "--tileWidth": `${tileSize}px`, "--tileHeight": `${tileSize}px` } as React.CSSProperties}>
                    {new Array(tileCount).fill("").map((eachRow, eachRowIndex) => {//grey tiles
                        return (
                            <React.Fragment key={eachRowIndex}>
                                {new Array(tileCount).fill("").map((eachColumn, eachColumnIndex) => {
                                    return (
                                        <div key={`${eachRowIndex}_${eachColumnIndex}`} className={`${styles.tile} ${styles.grayTile}`} style={{ top: `${eachRowIndex * tileSize}px`, left: `${eachColumnIndex * tileSize}px` }}
                                            onClick={() => { makeTileAtRowColumnIndex(eachRowIndex, eachColumnIndex) }}
                                        >
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
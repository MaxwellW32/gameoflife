"use client"
import React, { useEffect, useRef, useState } from 'react'
import { v4 } from 'uuid'
import styles from "./page.module.css"
import { deepClone } from '@/utility/utility'

type tileType = {
    id: string,
    columnIndex: number,
    rowIndex: number,
    type: "white" | "black",
    element: HTMLDivElement
}

type tileTypeAtIndexType = "black" | "white" | "grey"

type tileColumnRowIndexObjType = { [key: string]: Pick<tileType, "type"> | null }

type moveActionType =
    | "up"
    | "down"
    | "left"
    | "right"

const tileRules: { [key: string]: moveActionType[] } = {
    "grey_grey_grey_grey_grey_grey_grey_grey": [],
}

export default function Home() {
    const tileWidth = useRef(40)
    const tileHeight = useRef(40)
    const tileCount = useRef(50)

    const sectionContRef = useRef<HTMLDivElement | null>(null)
    const tileContRef = useRef<HTMLDivElement | null>(null)
    const tiles = useRef<tileType[]>([])
    const tileColumnRowIndexObj = useRef<tileColumnRowIndexObjType>({})

    const mounted = useRef(false)
    const [showingMenu, showingMenuSet] = useState(false)
    const [, refresherSet] = useState(false)

    //xy is law
    //x - columnIndex - tileWidth - left
    //y - rowIndex - tileHeight - top

    //start off tileColumnRowIndexObj
    useEffect(() => {
        //map all positions
        clearTileColumnRowIndexObj()

    }, [])

    //start loop
    useEffect(() => {
        if (mounted.current) return
        mounted.current = true

        //map all positions
        runTileLoop()

    }, [])

    function generateTiles() {
        if (tileContRef.current === null) return

        const amtToMake = Math.floor((tileCount.current * tileCount.current) / 10)

        for (let index = 0; index < amtToMake; index++) {
            const availableTileColumnRowIndexObjKeys = Object.entries(tileColumnRowIndexObj.current).filter(eachEntry => eachEntry[1] === null).map(eachEntry => eachEntry[0])
            if (availableTileColumnRowIndexObjKeys.length === 0) {
                break
            }

            const randomColumnRowStr = availableTileColumnRowIndexObjKeys[Math.floor(Math.random() * availableTileColumnRowIndexObjKeys.length)]
            const [randomColumn, randomRow] = randomColumnRowStr.split("_").map(each => parseInt(each))

            const newTile = makeNewTile(randomColumn, randomRow)

            tiles.current.push(newTile)
            tileContRef.current.appendChild(newTile.element)

            //add onto tileColumnRowIndexObj
            tileColumnRowIndexObj.current[`${newTile.columnIndex}_${newTile.rowIndex}`] = { type: newTile.type }
        }
    }

    function makeTileAtColumnRowIndex(columnIndex: number, rowIndex: number) {
        if (tileContRef.current === null) return
        if (tileColumnRowIndexObj.current[`${columnIndex}_${rowIndex}`] !== null) {
            const foundTile = tiles.current.find(eachTile => eachTile.columnIndex === columnIndex && eachTile.rowIndex === rowIndex)

            if (foundTile !== undefined) {
                foundTile.element.classList.toggle(styles.highlighted)
            }

            return
        }

        const newTile = makeNewTile(columnIndex, rowIndex)

        tiles.current.push(newTile)
        tileContRef.current.appendChild(newTile.element)

        //add onto tileColumnRowIndexObj
        tileColumnRowIndexObj.current[`${newTile.columnIndex}_${newTile.rowIndex}`] = { type: newTile.type }
    }

    function makeNewTile(columnIndex: number, rowIndex: number) {
        const newTileId = v4()
        const newTileType = Math.random() > 0.005 ? "black" : "white"

        const newElement = document.createElement("div")
        //styling
        newElement.id = newTileId
        newElement.classList.add(styles.tile)
        newElement.style.left = `${columnIndex * tileWidth.current}px`
        newElement.style.top = `${rowIndex * tileHeight.current}px`
        newElement.style.backgroundColor = newTileType === "black" ? "#000" : "#fff"

        const newTile: tileType = {
            id: newTileId,
            columnIndex: columnIndex,
            rowIndex: rowIndex,
            type: newTileType,
            element: newElement
        }

        return newTile
    }

    function runTileLoop() {
        const staticTileColumnRowIndexObj = deepClone(tileColumnRowIndexObj.current)

        const startingTilePositions: { [key: string]: { startingColumnIndex: number, startingRowIndex: number } } = {}

        //for each tile
        for (let index = 0; index < tiles.current.length; index++) {
            const eachTile = tiles.current[index];

            //add onto startingTilePositions
            startingTilePositions[eachTile.id] = { startingColumnIndex: eachTile.columnIndex, startingRowIndex: eachTile.rowIndex }

            const seen8PointCoordsString = get8PointCoordinates(eachTile, staticTileColumnRowIndexObj).join("_")

            let actions: moveActionType[] | undefined = tileRules[seen8PointCoordsString]
            if (actions === undefined) {
                const newRules = generateUniqueRandomTileRules()

                tileRules[seen8PointCoordsString] = newRules
                actions = tileRules[seen8PointCoordsString]

                console.log(`$no moves for ${seen8PointCoordsString} - creating new movements`);
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

        recursiveSharingPosCheck()
        function recursiveSharingPosCheck() {
            const tilesSharingPos = checkTilesSharingPos()

            //reset all tiles sharing positions
            tilesSharingPos.map(eachTileSharingPos => {
                const foundTile = tiles.current.find(eachTileFind => eachTileFind.id === eachTileSharingPos.id)
                if (foundTile !== undefined) {
                    //tile sharing position with another - cancel transformation
                    foundTile.columnIndex = startingTilePositions[foundTile.id].startingColumnIndex
                    foundTile.rowIndex = startingTilePositions[foundTile.id].startingRowIndex

                    //show that element can't move
                    foundTile.element.classList.add(styles.firm)

                    setTimeout(() => {
                        foundTile.element.classList.remove(styles.firm)
                    }, 1000);
                }
            })

            //check again
            const tilesSharingPos2: tileType[] = checkTilesSharingPos()
            if (tilesSharingPos2.length > 0) {
                recursiveSharingPosCheck()
            }

            function checkTilesSharingPos() {
                const tilesSharingPos: tileType[] = []

                //handle showing movements
                tiles.current.map(eachTile => {
                    tiles.current.map(eachTileMap => {
                        if ((eachTileMap.id !== eachTile.id) && (eachTileMap.columnIndex === eachTile.columnIndex) && (eachTileMap.rowIndex === eachTile.rowIndex)) {
                            const notInArray = tilesSharingPos.find(eachTileSharingPos => eachTileSharingPos.id === eachTileMap.id) === undefined
                            if (notInArray) {
                                tilesSharingPos.push(eachTileMap)
                            }
                        }
                    })
                })

                return tilesSharingPos
            }
        }


        //show update
        for (let index = 0; index < tiles.current.length; index++) {
            const eachTile = tiles.current[index];

            updateTilePosOnDom(eachTile)
        }

        //reset and update tileColumnRowIndexObj with tiles
        clearTileColumnRowIndexObj()
        for (let index = 0; index < tiles.current.length; index++) {
            const eachTile = tiles.current[index];

            tileColumnRowIndexObj.current[`${eachTile.columnIndex}_${eachTile.rowIndex}`] = { type: eachTile.type }
        }

        setTimeout(() => {
            runTileLoop()
        }, 1000);
    }

    function get8PointCoordinates(tile: tileType, seenTileColumnRowIndexObj: tileColumnRowIndexObjType) {
        //return black/white/grey
        const tileTypeAtIndexArr: tileTypeAtIndexType[] = ["grey", "grey", "grey", "grey", "grey", "grey", "grey", "grey"]

        for (let index = 0; index < 8; index++) {
            let currentColumnIndex = tile.columnIndex
            let currentRowIndex = tile.rowIndex

            if (index === 0) {
                currentColumnIndex -= 1
                currentRowIndex -= 1

            } else if (index === 1) {
                currentRowIndex -= 1

            } else if (index === 2) {
                currentColumnIndex += 1
                currentRowIndex -= 1

            } else if (index === 3) {
                currentColumnIndex -= 1

            } else if (index === 4) {
                currentColumnIndex += 1

            } else if (index === 5) {
                currentColumnIndex -= 1
                currentRowIndex += 1

            } else if (index === 6) {
                currentRowIndex += 1

            } else if (index === 7) {
                currentColumnIndex += 1
                currentRowIndex += 1
            }

            // WRAP HERE
            currentColumnIndex = wrapTileIndex(currentColumnIndex)
            currentRowIndex = wrapTileIndex(currentRowIndex)

            const foundAdjTile = seenTileColumnRowIndexObj[`${currentColumnIndex}_${currentRowIndex}`]
            if (foundAdjTile !== null) {
                tileTypeAtIndexArr[index] = foundAdjTile.type
            }
        }

        return tileTypeAtIndexArr
    }

    function wrapTileIndex(index: number) {
        return (index + tileCount.current) % tileCount.current
    }

    function ensureInBounds(newIndex: number) {
        if (newIndex > tileCount.current - 1) {
            newIndex = 0

        } else if (newIndex < 0) {
            newIndex = tileCount.current - 1
        }

        return newIndex
    }

    function updateTilePosOnDom(tile: tileType) {
        tile.element.style.left = `${tile.columnIndex * tileWidth.current}px`
        tile.element.style.top = `${tile.rowIndex * tileHeight.current}px`
    }

    function generateUniqueRandomTileRules() {
        const moveOptions: moveActionType[] = ["up", "down", "left", "right"]

        const moveCount = Math.floor(Math.random() * 3) + 1

        const newMovements = Array.from({ length: moveCount }, () =>
            moveOptions[Math.floor(Math.random() * moveOptions.length)]
        )

        return newMovements
    }

    function clearTileColumnRowIndexObj() {
        for (let indexRow = 0; indexRow < tileCount.current; indexRow++) {//y
            for (let indexColumn = 0; indexColumn < tileCount.current; indexColumn++) {//x
                tileColumnRowIndexObj.current[`${indexColumn}_${indexRow}`] = null
            }
        }
    }

    function refresh() {
        refresherSet(prev => !prev)
    }

    function fitTilesToCanvas() {
        if (sectionContRef.current === null) return
        const seenWidth = sectionContRef.current.clientWidth
        const seenHeight = sectionContRef.current.clientHeight

        tileWidth.current = seenWidth / tileCount.current
        tileHeight.current = seenHeight / tileCount.current

        refresh()
    }

    return (
        <div style={{ display: "grid", gridTemplateRows: "1fr", overflow: "auto", position: "relative", zIndex: 0 }}>
            <div style={{ position: "absolute", top: 0, left: 0, zIndex: 1, width: "100%" }}>
                {showingMenu ? (
                    <div className={styles.gameControls}>
                        <button
                            onClick={() => {
                                showingMenuSet(false)
                            }}
                        >
                            <svg className='svgIcon' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" /></svg>
                        </button>

                        <h1 className={styles.gameTitle}>Game Of Life</h1>

                        <div className={styles.controlsRow}>
                            <div className={styles.inputGroup}>
                                <label>Tile Width</label>
                                <input
                                    type="number"
                                    value={tileWidth.current}
                                    onChange={(e) => {
                                        tileWidth.current = parseInt(e.target.value)
                                        refresh()
                                    }}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Tile Height</label>
                                <input
                                    type="number"
                                    value={tileHeight.current}
                                    onChange={(e) => {
                                        tileHeight.current = parseInt(e.target.value)
                                        refresh()
                                    }}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Grid Size</label>
                                <input
                                    type="number"
                                    value={tileCount.current}
                                    onChange={(e) => {
                                        tileCount.current = parseInt(e.target.value)
                                        refresh()
                                    }}
                                />
                            </div>
                        </div>

                        <div className={styles.buttonRow}>
                            <button
                                className={styles.buttonSecondary}
                                onClick={fitTilesToCanvas}
                            >
                                Fit Canvas
                            </button>

                            <button
                                className={styles.buttonPrimary}
                                onClick={generateTiles}
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            onClick={() => {
                                showingMenuSet(true)
                            }}
                        >
                            <svg className='svgIcon' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z" /></svg>
                        </div>
                    </>
                )}
            </div>

            <div ref={sectionContRef} style={{ display: "grid", overflow: "auto" }}>
                <div ref={tileContRef} className={styles.tileCont} style={{ width: `${tileWidth.current * tileCount.current}px`, height: `${tileHeight.current * tileCount.current}px`, position: "relative", "--tileWidth": `${tileWidth.current}px`, "--tileHeight": `${tileHeight.current}px` } as React.CSSProperties}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()

                        const relativeX = e.clientX - rect.left
                        const relativeY = e.clientY - rect.top

                        const seenColumnIndex = Math.floor((relativeX / tileWidth.current))
                        const seenRowIndex = Math.floor((relativeY / tileHeight.current))

                        //add tile
                        makeTileAtColumnRowIndex(seenColumnIndex, seenRowIndex)
                    }}
                ></div>
            </div>
        </div>
    )
}
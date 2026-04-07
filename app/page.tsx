"use client"
import React, { useEffect, useRef, useState } from 'react'
import { v4 } from 'uuid'
import styles from "./page.module.css"
import { deepClone } from '@/utility/utility'
import toast from 'react-hot-toast'
import { moveActionType, tileRulesSchema, tileRulesType } from '@/types'
import { consoleAndToastError } from '@/utility/consoleErrorWithToast'

type tileType = {
    id: string,
    columnIndex: number,
    rowIndex: number,
    type: "white" | "black",
    element: HTMLDivElement
}

type tileTypeAtIndexType = "black" | "white" | "grey"

type tileColumnRowIndexObjType = { [key: string]: Pick<tileType, "type"> | null }

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

    const screenOptions = ["home", "rules"] as const
    type screenOptionsType = typeof screenOptions
    const [screen, screenSet] = useState<screenOptionsType[number]>("home")

    const tileRules = useRef<tileRulesType>({
        "grey_grey_grey_grey_grey_grey_grey_grey": [],
    })
    const autoGenNewRule = useRef(true)
    const selectedRuleKey = useRef<string | undefined>(undefined)

    const [showMore, setShowMore] = useState(false)
    const [rulesInput, setRulesInput] = useState("")

    //each index has a value - 0-7
    //directionAmtX, directionAmtY, rotations, scale, colour
    //grey tiles 1, black 2, white 3 
    //multiply by the index value
    //total on left is x, right is y - 18, 66, 84

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

                //select incase of edit
                const seen8PointCoordsString = get8PointCoordinates(foundTile, tileColumnRowIndexObj.current).join("_")

                if (tileRules.current[seen8PointCoordsString] === undefined) {
                    tileRules.current[seen8PointCoordsString] = []
                }

                selectedRuleKey.current = seen8PointCoordsString
                refresh()
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

            let actions: moveActionType[] | undefined = tileRules.current[seen8PointCoordsString]
            if (actions === undefined) {
                if (autoGenNewRule.current) {
                    // const newRules = generateUniqueRandomTileRules()
                    const newRules = getActionsFromCoords(seen8PointCoordsString)

                    tileRules.current[seen8PointCoordsString] = newRules
                    actions = tileRules.current[seen8PointCoordsString]

                    console.log(`$no moves for ${seen8PointCoordsString} - creating new movements`);
                    console.log(`$tileRules`, tileRules.current);
                    refresh()

                } else {
                    continue
                }
            }

            //apply actions
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

            //update pos
            updateTilePosOnDom(eachTile)

            // //apply colors
            // const seen8PointCoordsString = get8PointCoordinates(eachTile, tileColumnRowIndexObj.current).join("_")
            // const { total } = getTotalsFromCoords(seen8PointCoordsString)

            // const decNum = total / 84 //max number

            // const clamped = Math.max(0, Math.min(1, decNum))
            // const hue = clamped * 360
            // console.log(`$decNum`, decNum)

            // eachTile.element.style.borderBlock = `${tileHeight.current * 0.1}px inset hsl(${hue}, 100%, 50%)`
            // eachTile.element.style.borderInline = `${tileWidth.current * 0.1}px inset hsl(${hue}, 100%, 50%)`
        }

        //reset and update tileColumnRowIndexObj with tiles
        clearTileColumnRowIndexObj()
        addTilesToColumnRowIndexObj()

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
            if (foundAdjTile === undefined) {
                console.log(`$currentColumnIndex`, currentColumnIndex)
                console.log(`$currentRowIndex`, currentRowIndex)

            }
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

    function getTotalsFromCoords(seen8PointCoordsString: string) {
        let total = 0
        let leftTotal = 0
        let rightTotal = 0

        const coordsArr = seen8PointCoordsString.split("_")

        const colorValueObj: { [key: string]: number } = {
            "grey": 1,
            "black": 2,
            "white": 3
        }

        for (let index = 0; index < coordsArr.length; index++) {
            const seenTileColour = coordsArr[index]
            const valForTile = colorValueObj[seenTileColour] * index

            if (index < 4) {
                leftTotal += valForTile

            } else {
                rightTotal += valForTile
            }

            total += valForTile
        }

        return { total, leftTotal, rightTotal }
    }

    function getActionsFromCoords(seen8PointCoordsString: string) {
        const { leftTotal, rightTotal } = getTotalsFromCoords(seen8PointCoordsString)

        let moveCountX = Math.floor(Math.random() * 3) + 1
        let moveCountY = Math.floor(Math.random() * 3) + 1

        if (Math.random() > 0.95) {//x
            moveCountX *= 2
        }

        if (Math.random() > 0.95) {//y
            moveCountY *= 2
        }

        const remanx = leftTotal / 18
        const remanY = rightTotal / 66

        console.log(`$remanx`, remanx)
        console.log(`$remanY`, remanY)

        const chosenDirectionX = Math.random() > remanx ? "left" : "right"
        const chosenDirectionY = Math.random() > remanY ? "up" : "down"

        const newMovementsX = Array(moveCountX).fill(chosenDirectionX)
        const newMovementsY = Array(moveCountY).fill(chosenDirectionY)

        const newMovements = [...newMovementsX, ...newMovementsY]

        return newMovements
    }

    function clearTileColumnRowIndexObj() {
        for (let indexRow = 0; indexRow < tileCount.current; indexRow++) {//y
            for (let indexColumn = 0; indexColumn < tileCount.current; indexColumn++) {//x
                tileColumnRowIndexObj.current[`${indexColumn}_${indexRow}`] = null
            }
        }
    }
    function addTilesToColumnRowIndexObj() {
        for (let index = 0; index < tiles.current.length; index++) {
            const eachTile = tiles.current[index];

            tileColumnRowIndexObj.current[`${eachTile.columnIndex}_${eachTile.rowIndex}`] = { type: eachTile.type }
        }
    }

    function refresh() {
        refresherSet(prev => !prev)
    }

    function fitTilesToCanvas() {
        if (sectionContRef.current === null) return
        const seenWidth = sectionContRef.current.clientWidth
        const seenHeight = sectionContRef.current.clientHeight

        tileWidth.current = Math.floor(seenWidth / tileCount.current)
        tileHeight.current = Math.floor(seenHeight / tileCount.current)

        refresh()
    }

    function addRuleMovement(option: moveActionType) {
        if (selectedRuleKey.current === undefined || tileRules.current[selectedRuleKey.current] === undefined) return

        tileRules.current[selectedRuleKey.current].push(option)

        refresh()
    }

    function getPatternStyle(pattern: string, size = 10) {
        const colors = pattern.split("_")

        const positions = [
            [-1, -1], // top left
            [0, -1],  // top middle
            [1, -1],  // top right
            [-1, 0],  // middle left
            [1, 0],   // middle right
            [-1, 1],  // bottom left
            [0, 1],   // bottom middle
            [1, 1],   // bottom right
        ]

        const shadows = colors.map((color, i) => {
            const [x, y] = positions[i]
            return `${x * size}px ${y * size}px 0 0 ${color}`
        })

        return {
            width: `${size}px`,
            height: `${size}px`,
            background: "gold", // center square
            boxShadow: shadows.join(", "),
            margin: `${size}px`,
        }
    }

    return (
        <div style={{ display: "grid", gridTemplateRows: "1fr", overflow: "auto", position: "relative", zIndex: 0 }}>
            <div style={{ position: "absolute", top: 0, left: 0, zIndex: 1, display: "grid" }}>
                {showingMenu ? (
                    <div className={styles.gameControls}>
                        <div className='simpleFlex'>
                            <ul className='simpleFlex'>
                                {screenOptions.map((eachScreenOption) => {
                                    return (
                                        <li key={eachScreenOption}
                                            onClick={() => {
                                                screenSet(eachScreenOption)
                                            }}
                                        >
                                            {eachScreenOption}
                                        </li>
                                    )
                                })}
                            </ul>

                            <button
                                onClick={() => {
                                    showingMenuSet(false)
                                }}
                            >
                                <svg className='svgIcon' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" /></svg>
                            </button>
                        </div>

                        {screen === "home" && (
                            <>
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

                                                clearTileColumnRowIndexObj()
                                                addTilesToColumnRowIndexObj()

                                                refresh()
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="simpleFlex">
                                    <button className="button2"
                                        onClick={fitTilesToCanvas}
                                    >
                                        Fit Canvas
                                    </button>

                                    <button
                                        className="button1"
                                        onClick={generateTiles}
                                    >
                                        Generate
                                    </button>
                                </div>
                            </>
                        )}

                        {screen === "rules" && (
                            <>
                                <h2>Rules</h2>

                                <button className={autoGenNewRule.current ? "button1" : "button2"}
                                    onClick={() => {
                                        autoGenNewRule.current = !autoGenNewRule.current
                                        refresh()
                                    }}
                                >auto-gen</button>

                                <div>
                                    <div style={{ display: "grid", gap: "1rem", maxHeight: "200px", overflow: "auto", alignContent: "flex-start", }}>
                                        {Object.entries(tileRules.current).map(eachEntry => {
                                            const eachKey = eachEntry[0]
                                            const eachValue = eachEntry[1]

                                            return (
                                                <div key={eachKey} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: ".5rem", border: "1px solid #000" }}
                                                    onClick={() => {
                                                        toast.success("selected")

                                                        //select key
                                                        selectedRuleKey.current = eachKey

                                                        //add to obj
                                                        if (tileRules.current[selectedRuleKey.current] === undefined) {
                                                            tileRules.current[selectedRuleKey.current] = []
                                                        }

                                                        refresh()
                                                    }}
                                                >
                                                    <div style={{ ...getPatternStyle(eachKey) }}></div>

                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                                                        <div className='simpleFlex' style={{ flexWrap: "nowrap", overflow: "auto" }}>
                                                            {eachValue.length === 0 && <li>do nothing</li>}

                                                            {eachValue.map((eachAction, eachActionIndex) => {
                                                                return (
                                                                    <li key={eachActionIndex}>{eachAction}</li>
                                                                )
                                                            })}
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()

                                                                delete tileRules.current[eachKey]

                                                                toast.success("deleted")

                                                                refresh()
                                                            }}
                                                        >
                                                            <svg className='svgIcon' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {selectedRuleKey.current !== undefined && tileRules.current[selectedRuleKey.current] !== undefined && (
                                    <>
                                        <h3>Edit Rule</h3>

                                        <div style={{ ...getPatternStyle(selectedRuleKey.current) }}></div>

                                        <div className='simpleFlex'>
                                            <button className='button2'
                                                onClick={() => {
                                                    addRuleMovement("up")
                                                }}
                                            >up</button>

                                            <button className='button2'
                                                onClick={() => {
                                                    addRuleMovement("down")
                                                }}
                                            >down</button>

                                            <button className='button2'
                                                onClick={() => {
                                                    addRuleMovement("left")
                                                }}
                                            >left</button>

                                            <button className='button2'
                                                onClick={() => {
                                                    addRuleMovement("right")
                                                }}
                                            >right</button>
                                        </div>

                                        <ul className='simpleFlex'>
                                            {tileRules.current[selectedRuleKey.current].length === 0 && <li>do nothing</li>}

                                            {tileRules.current[selectedRuleKey.current].map((eachAction, eachActionIndex) => {
                                                return (
                                                    <li key={eachActionIndex}>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedRuleKey.current === undefined) return

                                                                tileRules.current[selectedRuleKey.current] = tileRules.current[selectedRuleKey.current].filter((eachActionFilter, eachActionFilterIndex) => eachActionFilterIndex !== eachActionIndex)

                                                                refresh()
                                                            }}
                                                        >
                                                            <svg className='svgIcon' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" /></svg>
                                                        </button>

                                                        <p>{eachAction}</p>
                                                    </li>
                                                )
                                            })}
                                        </ul>

                                    </>
                                )}

                                <div className="simpleGrid" style={{ gap: "1rem" }}>
                                    <button className="button2"
                                        onClick={() => setShowMore(prev => !prev)}
                                    >
                                        {showMore ? "Hide Advanced" : "Show More"}
                                    </button>

                                    {showMore && (
                                        <div className="simpleGrid">
                                            <div className="simpleFlex">
                                                <button
                                                    className="button2"
                                                    onClick={() => {
                                                        const text = JSON.stringify(
                                                            tileRules.current,
                                                            null,
                                                            2
                                                        )

                                                        navigator.clipboard.writeText(text)

                                                        toast.success("copied!")
                                                    }}
                                                >
                                                    Copy Rules
                                                </button>

                                                <button
                                                    className="button1"
                                                    onClick={() => {
                                                        try {
                                                            const parsed = JSON.parse(rulesInput)

                                                            //validation
                                                            tileRulesSchema.parse(parsed)

                                                            //safety
                                                            tileRules.current = Object.assign(
                                                                Object.create(null),
                                                                parsed
                                                            )

                                                            toast.success("Rules loaded successfully")

                                                        } catch (error) {
                                                            consoleAndToastError(error)
                                                        }
                                                    }}
                                                >
                                                    Paste / Load Rules
                                                </button>
                                            </div>

                                            <textarea placeholder="Paste tile rules JSON here..." value={rulesInput}
                                                onChange={(e) => setRulesInput(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div style={{ justifySelf: "flex-start" }}
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
                <div ref={tileContRef} className={styles.tileCont} style={{ width: `${tileWidth.current * tileCount.current}px`, height: `${tileHeight.current * tileCount.current}px`, "--tileWidth": `${tileWidth.current}px`, "--tileHeight": `${tileHeight.current}px` } as React.CSSProperties}
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
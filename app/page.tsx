"use client"
import React, { useRef } from 'react'
import { v4 } from 'uuid'
import styles from "./page.module.css"

type tileType = {
    id: string,
    xIndex: number,
    yIndex: number,
    type: "white" | "black"
}

export default function Home() {
    const tileSize = 40
    const tileCount = 10

    const tileContRef = useRef<HTMLDivElement | null>(null)
    const tiles = useRef<tileType[]>([])

    function generateTiles() {
        if (tileContRef === null) return

        const xyIndexObj: { [key: string]: boolean } = {}

        //map all positions
        for (let indexRow = 0; indexRow < tileCount; indexRow++) {//y
            for (let indexColumn = 0; indexColumn < tileCount; indexColumn++) {//x
                xyIndexObj[`${indexColumn}_${indexRow}`] = false
            }
        }

        const amt = 10

        for (let index = 0; index < amt; index++) {
            const falseXyIndexObjKeys = Object.entries(xyIndexObj).filter(eachEntry => !eachEntry[1]).map(eachEntry => eachEntry[0])
            if (falseXyIndexObjKeys.length === 0) continue

            const randomXYKey = falseXyIndexObjKeys[Math.floor(Math.random() * falseXyIndexObjKeys.length)]
            const [randomXPosition, randomYPosition] = randomXYKey.split("_").map(each => parseInt(each))

            //mark as used position from xyIndexObj
            xyIndexObj[randomXYKey] = true

            const newTile: tileType = {
                id: v4(),
                xIndex: randomXPosition,
                yIndex: randomYPosition,
                type: "black"
            }

            tiles.current.push(newTile)
        }

        console.log(`$xyIndexObj`, xyIndexObj);

        drawTiles()
    }

    function drawTiles() {
        if (tileContRef.current === null) return

        //reset children
        tileContRef.current.innerHTML = ""

        tiles.current.map(eachTile => {
            const newHtmlElement = document.createElement("div")

            //add id
            newHtmlElement.id = eachTile.id

            //styling
            newHtmlElement.classList.add(styles.tile)
            newHtmlElement.style.width = `${tileSize}px`
            newHtmlElement.style.height = `${tileSize}px`
            newHtmlElement.style.top = `${eachTile.yIndex * tileSize}px`
            newHtmlElement.style.left = `${eachTile.xIndex * tileSize}px`
            newHtmlElement.style.backgroundColor = eachTile.type === "black" ? "#000" : "#fff"

            tileContRef.current!.appendChild(newHtmlElement)
        })
    }

    return (
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", overflow: "auto" }}>
            <div>
                <h1>Game Of Life</h1>

                <button className='button2'
                    onClick={generateTiles}
                >generate</button>
            </div>

            <div style={{ display: "grid", overflow: "auto" }}>
                <div ref={tileContRef} style={{ width: `${tileSize * tileCount}px`, height: `${tileSize * tileCount}px`, position: "relative", backgroundColor: "gray" }}></div>
            </div>
        </div>
    )
}

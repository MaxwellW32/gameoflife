"use client"
import React, { useRef } from 'react'
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

type tileRowColumnIndexObjType = { [key: string]: Pick<tileType, "type"> | undefined }

type moveActionType =
    | "up"
    | "down"
    | "left"
    | "right"

const tileRules: { [key: string]: moveActionType[] } = {
    "grey_grey_grey_grey_grey_grey_grey_grey": ["up", "right"],
    "black_black_grey_grey_grey_black_white_white": ["down", "up", "down"],
    "grey_black_white_white_white_black_white_white": ["up", "down"],
    "white_white_white_white_grey_black_black_white": ["up"],
    "black_white_grey_white_grey_black_black_grey": ["left"],
    "black_black_black_grey_grey_white_white_grey": ["down"],
    "black_white_white_grey_white_white_white_black": ["right"],
    "black_grey_grey_grey_grey_white_black_grey": ["right", "right"],
    "white_grey_white_grey_grey_grey_black_grey": ["right", "right"],
    "white_white_grey_grey_white_grey_white_black": ["left"],
    "white_black_black_grey_black_white_grey_white": ["right", "up"],
    "white_white_black_white_grey_black_black_grey": ["right"],
    "grey_grey_grey_white_grey_white_white_white": ["left", "down", "up"],
    "grey_white_white_grey_white_black_black_black": ["left", "down", "down"],
    "white_black_white_grey_white_grey_white_black": ["right", "right"],
    "white_grey_white_white_black_white_white_white": ["up", "up"],
    "black_grey_white_grey_grey_black_black_white": ["left", "down"],
    "black_white_white_white_white_black_grey_grey": ["up"],
    "white_white_white_black_white_white_black_grey": ["right", "down"],
    "white_white_grey_white_black_grey_white_grey": ["left", "right"],
    "black_grey_grey_white_black_black_black_white": ["up", "left", "up"],
    "black_grey_grey_grey_white_grey_black_grey": ["up", "right"],
    "white_black_white_black_white_grey_white_grey": ["up"],
    "black_black_grey_grey_black_white_black_black": ["down", "up", "left"],
    "black_black_black_grey_black_grey_grey_black": ["left"],
    "grey_white_black_grey_grey_white_grey_grey": ["up"],
    "white_white_grey_grey_grey_grey_white_grey": ["up"],
    "white_white_white_black_grey_white_grey_grey": ["down", "up", "up"],
    "white_black_grey_grey_black_white_black_white": ["right", "left"],
    "white_white_grey_grey_white_white_black_grey": ["right", "up", "up"],
    "grey_grey_black_black_grey_grey_grey_black": ["left", "right", "down"],
    "grey_grey_black_grey_grey_grey_grey_grey": ["up"],
    "white_white_grey_white_grey_white_white_grey": ["up", "left", "down"],
    "white_grey_white_grey_white_black_grey_white": ["right", "up"],
    "black_grey_grey_grey_white_grey_white_grey": ["left", "left", "down"],
    "white_grey_black_grey_grey_grey_white_black": ["up", "down", "right"],
    "white_black_black_black_black_white_white_black": ["right", "up", "left"],
    "black_white_grey_grey_grey_white_white_black": ["right"],
    "black_black_grey_black_grey_grey_black_black": ["up", "left", "up"],
    "grey_white_grey_white_white_white_black_grey": ["down", "down", "left"],
    "white_white_grey_black_white_white_white_black": ["right", "left"],
    "grey_white_grey_grey_white_white_grey_white": ["left", "up"],
    "black_black_grey_black_grey_grey_grey_white": ["left", "up"],
    "black_grey_white_white_white_black_black_grey": ["right", "up"],
    "white_grey_grey_white_white_black_grey_white": ["down", "left", "right"],
    "black_white_black_black_grey_grey_black_white": ["down", "up", "up"],
    "grey_black_white_white_grey_white_white_black": ["left", "down"],
    "black_white_black_grey_grey_white_white_white": ["left"],
    "black_grey_black_white_black_black_white_black": ["right"],
    "grey_white_grey_black_grey_white_black_grey": ["right", "left"],
    "grey_grey_white_white_white_black_black_black": ["up", "left", "up"],
    "black_white_grey_grey_white_grey_white_white": ["up", "right"],
    "white_white_black_black_white_grey_black_black": ["up", "down"],
    "white_black_white_black_grey_black_white_black": ["right"],
    "black_white_black_grey_black_black_white_black": ["down", "down", "right"],
    "black_grey_grey_grey_white_white_white_grey": ["up"],
    "white_white_black_black_black_grey_grey_white": ["left"],
    "grey_grey_grey_grey_white_black_grey_white": ["up", "left", "down"],
    "black_grey_black_white_black_grey_white_grey": ["up", "left", "up"],
    "white_black_black_white_grey_black_black_grey": ["down"],
    "white_black_white_grey_grey_black_grey_white": ["left", "up"],
    "black_black_white_white_white_black_black_black": ["left", "right"],
    "black_black_white_grey_black_white_black_black": ["down"],
    "white_white_black_black_white_grey_white_black": ["down", "up", "right"],
    "white_white_grey_black_white_grey_black_white": ["down", "left"],
    "black_white_white_grey_grey_grey_black_white": ["down", "right"],
    "white_black_black_white_black_black_grey_white": ["up"],
    "white_grey_black_white_grey_black_white_black": ["down"],
    "grey_white_black_white_grey_white_black_black": ["right", "up"],
    "black_white_grey_black_grey_white_black_grey": ["up", "down", "up"],
    "white_black_grey_black_black_black_black_grey": ["right", "up"],
    "white_black_black_white_black_grey_white_grey": ["left"],
    "grey_white_black_black_white_white_white_black": ["left", "right"],
    "black_white_grey_white_black_black_black_grey": ["up", "up"],
    "black_black_white_white_grey_white_white_black": ["left", "down", "up"],
    "black_black_grey_white_black_black_white_black": ["right"],
    "white_white_grey_white_white_white_grey_white": ["right", "down"],
    "grey_black_grey_grey_black_black_black_black": ["up", "up"],
    "black_white_white_black_black_grey_white_black": ["left"],
    "black_white_black_black_black_grey_black_grey": ["up", "up", "up"],
    "black_white_white_black_grey_black_black_black": ["down", "down"],
    "white_white_white_grey_grey_grey_grey_white": ["left", "right"],
    "grey_grey_white_white_black_grey_white_white": ["left", "down"],
    "black_grey_grey_grey_white_white_black_black": ["up", "down", "down"],
    "black_grey_black_black_white_black_white_white": ["left", "down", "right"],
    "white_grey_grey_black_grey_white_white_white": ["right"],
    "white_black_grey_grey_white_white_grey_black": ["up", "left"],
    "black_grey_black_grey_black_white_white_white": ["up", "left"],
    "grey_grey_grey_white_white_white_black_black": ["down", "right", "down"],
    "white_white_white_black_grey_grey_white_black": ["right", "up", "up"],
    "grey_black_grey_grey_grey_grey_grey_white": ["up", "up", "down"],
    "black_grey_grey_grey_grey_grey_black_black": ["left", "down"],
    "white_grey_black_grey_black_black_grey_grey": ["right", "up", "up"],
    "grey_grey_black_black_grey_white_black_grey": ["left", "up"],
    "grey_grey_white_black_white_grey_black_black": ["down"],
    "grey_grey_grey_grey_white_black_black_white": ["right", "left"],
    "grey_black_grey_grey_grey_grey_white_grey": ["right"],
    "grey_grey_black_white_white_grey_grey_grey": ["right", "left", "left"],
    "grey_grey_grey_white_black_black_grey_white": ["down", "up"],
    "white_grey_white_white_grey_grey_black_black": ["left", "right"],
    "grey_grey_white_white_black_white_black_white": ["right", "left", "left"],
    "white_white_white_grey_black_grey_black_white": ["up"],
    "black_white_white_black_black_grey_white_grey": ["up", "left"],
    "white_black_white_white_grey_grey_grey_grey": ["left"],
    "white_grey_grey_white_white_black_white_white": ["left", "down"],
    "black_white_black_grey_black_grey_grey_black": ["up", "down", "down"],
    "white_grey_white_white_white_grey_white_black": ["up", "down", "up"],
    "black_grey_grey_grey_grey_grey_grey_grey": ["left"],
    "white_grey_white_white_white_grey_black_black": ["down"],
    "white_grey_grey_black_white_grey_black_black": ["up"],
    "white_black_white_white_white_white_grey_black": ["right", "up"],
    "white_black_white_black_white_black_grey_black": ["up"],
    "black_grey_grey_white_white_black_black_grey": ["down", "down", "right"],
    "black_white_grey_white_white_white_black_grey": ["right"],
    "grey_black_black_grey_black_black_grey_grey": ["down"],
    "white_white_white_grey_grey_white_grey_black": ["right", "left"],
    "grey_grey_grey_black_grey_grey_grey_grey": ["right", "down"],
    "white_black_black_grey_white_black_grey_white": ["right"],
    "grey_grey_black_black_grey_black_black_black": ["down", "up", "up"],
    "grey_grey_grey_grey_black_white_grey_white": ["right", "right", "down"],
    "white_black_white_grey_black_white_black_black": ["left", "left"],
    "white_grey_black_white_white_white_white_black": ["down", "right", "down"],
    "white_grey_white_white_black_black_grey_white": ["up", "left", "up"],
    "grey_black_white_white_grey_black_grey_grey": ["right", "right"],
    "white_white_black_white_grey_white_black_white": ["up"],
    "white_white_grey_grey_white_black_black_grey": ["down", "up"],
    "white_grey_white_white_white_grey_black_white": ["up"],
    "grey_white_white_black_white_black_white_black": ["up", "up"],
    "black_white_grey_white_white_grey_grey_white": ["left"],
    "white_black_black_grey_white_grey_white_black": ["up", "up"],
    "grey_white_white_black_black_grey_grey_white": ["down"],
    "grey_black_black_black_grey_black_white_white": ["down"],
    "black_black_white_grey_white_black_black_grey": ["left"],
    "black_grey_white_grey_black_grey_grey_grey": ["left", "left", "left"],
    "black_grey_white_grey_grey_black_grey_black": ["left"],
    "grey_white_black_black_white_white_grey_white": ["down", "up"],
    "black_black_white_white_black_black_black_white": ["left", "down"],
    "grey_black_white_black_black_white_white_black": ["left", "left"],
    "grey_white_grey_black_white_grey_white_grey": ["down", "down"],
    "white_black_white_grey_grey_white_white_grey": ["left", "down", "up"],
    "white_black_grey_black_black_black_black_black": ["right", "down", "up"],
    "grey_black_white_black_grey_black_black_grey": ["up", "left"],
    "grey_black_white_white_white_black_grey_black": ["up"],
    "grey_white_grey_grey_white_black_white_black": ["down", "down", "left"],
    "black_black_grey_white_white_black_white_grey": ["up", "down", "up"],
    "black_white_black_black_white_white_grey_grey": ["up", "left", "up"],
    "white_black_white_white_grey_white_black_white": ["down"],
    "white_white_white_white_grey_black_white_black": ["right"],
    "grey_grey_black_grey_black_white_black_white": ["down", "left", "down"],
    "grey_white_grey_white_black_grey_black_black": ["right", "up", "right"],
    "black_black_grey_black_white_black_white_white": ["right"],
    "white_black_black_black_grey_black_black_grey": ["right", "right"],
    "grey_grey_black_black_grey_white_grey_black": ["up"],
    "grey_grey_white_grey_grey_white_black_white": ["down", "left"],
    "white_white_black_black_grey_grey_white_grey": ["right", "left"],
    "white_black_black_white_grey_white_black_grey": ["down"],
    "grey_black_white_grey_grey_white_white_grey": ["left"],
    "black_white_white_white_white_grey_grey_white": ["down", "right"],
    "grey_white_white_black_white_white_grey_white": ["left"],
    "grey_black_grey_grey_black_black_grey_white": ["left", "right"],
    "white_black_black_black_grey_grey_white_black": ["right", "up", "right"],
    "white_black_black_white_white_black_grey_grey": ["left", "down"],
    "black_grey_grey_black_white_black_black_black": ["up"],
    "grey_white_white_grey_white_white_black_grey": ["left", "down", "left"],
    "black_grey_grey_white_black_grey_black_black": ["down", "up", "left"],
    "black_black_white_grey_white_black_black_white": ["down", "up", "up"],
    "black_black_white_grey_black_white_black_white": ["left"],
    "grey_white_white_grey_grey_black_black_grey": ["up", "right"],
    "black_black_black_white_white_grey_black_white": ["up", "up", "up"],
    "white_grey_white_grey_grey_white_grey_white": ["left", "left", "up"],
    "grey_white_grey_black_white_grey_white_black": ["right", "up"],
    "grey_black_grey_white_black_white_grey_white": ["up", "right"],
    "black_grey_black_white_black_black_black_grey": ["right"],
    "grey_white_grey_grey_grey_black_white_grey": ["down", "right"],
    "black_black_black_grey_black_white_grey_white": ["up"],
    "grey_white_black_black_white_grey_grey_black": ["right"],
    "black_grey_white_grey_white_grey_white_grey": ["right", "left"],
    "grey_grey_black_grey_grey_black_black_white": ["left", "up", "left"],
    "black_black_grey_white_white_white_black_white": ["right"],
    "white_black_black_grey_white_white_white_white": ["down", "down", "up"],
    "grey_grey_grey_grey_grey_black_black_black": ["down", "right", "left"],
    "grey_grey_black_white_black_black_black_white": ["right", "up"],
    "grey_white_white_white_white_black_black_white": ["right", "down"],
    "white_black_grey_black_grey_white_grey_grey": ["up", "up"],
    "black_white_white_black_grey_white_white_grey": ["right", "right"],
    "grey_grey_black_grey_grey_grey_white_grey": ["up", "right", "left"],
    "grey_grey_grey_grey_white_white_white_white": ["down", "left"],
    "white_white_white_black_grey_grey_white_grey": ["up", "left", "up"],
    "grey_black_white_black_grey_white_black_black": ["right"],
    "white_white_white_white_black_grey_white_grey": ["right"],
    "white_black_black_black_grey_black_grey_white": ["right", "right"],
    "grey_grey_white_grey_white_grey_grey_grey": ["right", "left"],
    "black_grey_white_black_black_black_white_white": ["left", "up"],
    "white_white_white_grey_grey_grey_grey_black": ["down", "left", "right"],
    "black_white_black_white_grey_white_black_grey": ["right", "right"],
    "black_grey_black_black_black_black_grey_white": ["up", "down", "right"],
    "grey_white_grey_white_black_white_white_black": ["down", "up"],
    "black_white_black_grey_black_white_white_grey": ["up", "left", "up"],
    "black_white_black_black_black_grey_grey_grey": ["right"],
    "black_black_black_grey_white_grey_black_white": ["left"],
    "black_grey_white_white_grey_grey_grey_white": ["left"],
    "white_white_grey_white_black_white_white_white": ["up", "down", "down"],
    "grey_white_white_black_white_black_black_black": ["right"],
    "white_black_black_grey_white_white_black_black": ["up"],
    "white_grey_black_grey_white_grey_black_black": ["down", "down", "left"],
    "black_grey_grey_grey_black_black_white_grey": ["left", "down"],
    "white_grey_black_white_white_white_grey_black": ["right", "down", "right"],
    "grey_black_white_grey_grey_grey_white_grey": ["down", "right", "down"],
    "black_white_grey_white_grey_black_grey_black": ["left", "right"],
    "grey_white_white_white_black_white_grey_white": ["up"],
    "white_white_white_grey_grey_black_grey_black": ["left", "right", "left"],
    "black_grey_grey_black_grey_white_black_black": ["up", "right"],
    "white_white_black_white_black_white_grey_black": ["right", "up", "up"],
    "grey_grey_white_white_white_white_black_black": ["up"],
    "black_black_black_grey_white_white_black_black": ["right", "right", "up"],
    "grey_white_white_grey_white_grey_black_white": ["up", "right", "down"],
    "black_black_white_grey_black_white_grey_grey": ["down", "right"],
    "grey_black_white_black_black_white_black_black": ["up", "left"],
    "grey_white_white_black_black_white_grey_black": ["down", "down", "right"],
    "grey_white_black_grey_black_black_white_white": ["left", "down", "up"],
    "grey_black_white_black_grey_black_grey_white": ["up", "up"],
    "white_white_white_white_white_grey_white_black": ["down"],
    "black_white_black_white_black_grey_black_white": ["down", "left", "up"],
    "black_grey_grey_black_black_black_grey_black": ["right", "left"],
    "black_white_white_grey_black_black_black_grey": ["left", "right"],
    "black_black_grey_grey_grey_black_black_grey": ["down", "up"],
    "black_black_grey_black_white_black_black_grey": ["up", "down"],
    "black_grey_black_white_white_black_grey_grey": ["left"],
    "white_white_white_grey_black_black_black_grey": ["up", "right"],
    "black_grey_grey_black_black_white_white_black": ["right"],
    "grey_grey_white_black_white_grey_white_grey": ["left", "right", "right"],
    "grey_white_black_black_black_white_white_grey": ["right", "right", "down"],
    "grey_white_grey_white_grey_black_grey_white": ["left"],
    "white_white_black_black_grey_white_white_white": ["right"],
    "black_white_white_grey_black_grey_black_grey": ["right", "down"],
    "black_grey_white_black_black_white_black_black": ["right", "right", "down"],
    "white_black_black_black_grey_white_white_black": ["left"],
    "white_black_grey_grey_black_grey_white_grey": ["down", "right", "right"],
    "grey_white_black_grey_black_white_white_black": ["down", "right"],
    "white_grey_grey_black_white_white_black_white": ["left"],
    "white_black_grey_grey_grey_black_white_black": ["up", "down", "down"],
    "black_black_black_white_black_grey_white_black": ["right", "down"],
    "black_white_black_white_black_black_white_grey": ["right", "left"],
    "white_black_grey_grey_grey_white_white_grey": ["down"],
    "black_black_black_white_white_white_grey_black": ["down"],
    "white_black_grey_black_white_white_black_white": ["up", "right"],
    "white_white_grey_black_grey_white_white_black": ["down"],
    "grey_grey_grey_grey_black_white_black_black": ["left", "left", "down"],
    "white_black_black_black_black_grey_black_black": ["right", "left"],
    "white_white_white_grey_white_white_white_grey": ["right"],
    "black_black_white_white_black_grey_white_black": ["left"],
    "white_white_grey_grey_grey_black_white_black": ["left", "right", "right"],
    "black_grey_white_white_grey_white_black_white": ["right", "left", "left"],
    "black_grey_white_grey_white_grey_black_black": ["up", "down", "down"],
    "black_white_grey_black_grey_grey_white_black": ["left", "right"],
    "black_grey_white_grey_white_grey_white_white": ["down", "down"],
    "white_black_grey_grey_black_black_white_white": ["up", "left"],
    "grey_white_black_white_grey_white_grey_white": ["up", "down", "left"],
    "black_black_grey_black_black_grey_white_black": ["right", "up", "down"],
    "grey_black_black_white_white_black_white_grey": ["left", "right"],
    "grey_black_grey_grey_white_grey_black_grey": ["right"],
    "grey_black_white_grey_white_white_grey_white": ["up", "down"],
    "white_white_black_grey_white_black_white_white": ["down"],
    "grey_black_grey_white_black_black_black_white": ["up"],
    "white_black_grey_black_black_white_white_black": ["left"],
    "white_white_grey_black_grey_white_black_black": ["up", "left"],
    "white_white_grey_grey_grey_white_white_black": ["up", "left", "up"],
    "grey_white_black_white_white_white_white_black": ["left", "right"],
    "black_black_grey_black_black_grey_black_grey": ["right"],
    "black_black_black_black_black_black_black_black": ["right", "left", "down"],
    "grey_black_black_black_white_grey_grey_grey": ["down", "up"],
    "grey_grey_black_black_white_white_grey_black": ["down", "left", "down"],
    "grey_black_white_grey_white_grey_grey_white": ["down", "down", "down"],
    "grey_black_grey_white_grey_white_black_black": ["right", "right", "up"],
    "black_white_white_grey_black_grey_black_white": ["left", "left"],
    "white_white_white_white_black_black_black_grey": ["right"],
    "white_grey_grey_black_black_grey_black_grey": ["left", "up", "right"],
    "white_grey_white_black_grey_grey_black_black": ["left", "up", "down"],
    "white_white_black_black_white_white_black_black": ["up"],
    "grey_black_white_grey_grey_grey_white_black": ["down", "right", "right"],
    "white_black_black_grey_white_black_grey_grey": ["right", "up"],
    "black_black_grey_white_black_grey_black_white": ["up", "down"],
    "black_white_black_grey_white_black_white_white": ["down", "left", "left"],
    "grey_grey_grey_black_white_white_white_grey": ["left"],
    "grey_white_white_grey_white_black_black_grey": ["left"],
    "white_white_white_black_white_white_black_white": ["right", "left"],
    "black_white_white_black_white_grey_white_black": ["left", "left", "right"],
    "black_white_white_grey_black_white_grey_white": ["up"],
    "black_white_grey_grey_grey_white_white_grey": ["down"],
    "black_grey_white_white_black_white_white_white": ["right", "right", "right"],
    "grey_grey_white_white_grey_white_white_black": ["right"],
    "grey_white_black_black_grey_white_black_grey": ["down", "down", "down"],
    "white_grey_black_white_grey_white_black_white": ["down", "up", "right"],
    "white_white_white_white_white_white_white_white": ["up", "left"],
    "grey_black_grey_white_white_grey_grey_grey": ["down"],
    "black_white_white_black_grey_white_black_grey": ["down", "left"],
    "white_black_black_grey_black_black_black_grey": ["left", "up", "up"],
    "grey_grey_grey_white_grey_white_grey_grey": ["down"],
    "black_white_black_grey_grey_black_white_black": ["right", "left", "up"],
    "grey_white_white_black_black_grey_white_grey": ["down", "down", "left"]
}

//make movements better...
//make easier to look up location
//add for loop...

export default function Home() {
    const tileSize = 40
    const tileCount = 100

    const tileContRef = useRef<HTMLDivElement | null>(null)
    const tiles = useRef<tileType[]>([])
    const tileRowColumnIndexObj = useRef<tileRowColumnIndexObjType>({})

    function generateTiles() {
        if (tileContRef.current === null) return

        //map all positions
        const tileRowColumnIndexObjEntries = Object.entries(tileRowColumnIndexObj.current)
        if (tileRowColumnIndexObjEntries.length === 0) {//only run when empty
            for (let indexRow = 0; indexRow < tileCount; indexRow++) {//x
                for (let indexColumn = 0; indexColumn < tileCount; indexColumn++) {//y
                    tileRowColumnIndexObj.current[`${indexRow}_${indexColumn}`] = undefined
                }
            }
        }

        const amtToMake = Math.floor((tileCount * tileCount) / 10)

        for (let index = 0; index < amtToMake; index++) {
            const availableTileRowColumnIndexObjKeys = Object.entries(tileRowColumnIndexObj.current).filter(eachEntry => eachEntry[1] === undefined).map(eachEntry => eachEntry[0])
            if (availableTileRowColumnIndexObjKeys.length === 0) {
                break
            }

            const randomRowColumnStr = availableTileRowColumnIndexObjKeys[Math.floor(Math.random() * availableTileRowColumnIndexObjKeys.length)]
            const [randomRow, randomColumn] = randomRowColumnStr.split("_").map(each => parseInt(each))

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
            tileContRef.current.appendChild(newTile.element)

            //add onto tileRowColumnIndexObj
            tileRowColumnIndexObj.current[`${newTile.rowIndex}_${newTile.columnIndex}`] = { type: newTile.type }
        }

        console.log(`$tileRowColumnIndexObj`, tileRowColumnIndexObj.current);
    }

    function runTileLoop() {
        const staticTileRowColumnIndexObj = deepClone(tileRowColumnIndexObj.current)
        console.log(`$staticTileRowColumnIndexObj`, staticTileRowColumnIndexObj)

        for (let index = 0; index < tiles.current.length; index++) {
            const eachTile = tiles.current[index];

            const seen8PointCoordsString = get8PointCoordinates(eachTile, staticTileRowColumnIndexObj).join("_")

            let actions: moveActionType[] | undefined = tileRules[seen8PointCoordsString]
            if (actions === undefined) {
                tileRules[seen8PointCoordsString] = generateUniqueRandomTileRules()

                actions = tileRules[seen8PointCoordsString]
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

            //show update
            updateTilePosOnDom(eachTile)
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
            if (foundAdjTile !== undefined) {
                tileTypeAtIndexArr[index] = foundAdjTile.type
            }
        }

        return tileTypeAtIndexArr
    }

    function ensureInBounds(newIndex: number) {
        if (newIndex > tileCount - 1) {
            newIndex = 0
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
// region import
const { table } = require('table')
const chalk = require('chalk')
const math = require('mathjs')
const f = math.fraction
// endregion

// region input
const input = [
	[3,0,0,0,-1,-2,-3],
	[8,1,0,0,2,-1,2],
	[12,0,1,0,-1,3,3],
	[4,0,0,1,1,1,-5]
].map(row =>
	row.map(item => (typeof item === 'object' ? item : math.fraction(item, 1)))
)
// endregion

// region helper
const matrixClone = tableau => tableau.map(vectorClone)
const vectorClone = vector => vector.map(item => item)
const print = ({ indices, tableau, pivot }) => {
	const xIndices = [[''].concat(mapIndices(Array(tableau[0].length).fill(0).map((_, i) => i), tableau.length))]
	const result = tableau.map((row, y) =>
		mapIndices([indices[y]], tableau.length).concat(row.map((item, x) => {
			let style = chalk.white
			if (x === pivot.column || y === pivot.row) style = chalk.black.bgGreen
			if (x === pivot.column && y === pivot.row) style = chalk.black.bgYellow
			if (typeof item === 'number') return style(item)
			if (Math.floor(+item) === +item) return style(+item)
			return style(math.format(item, { notation: 'ratio' }))
		}))
	)
	console.log(table(xIndices.concat(result)))
}
const mapIndices = (indices, height) => indices.map(index => {
	if (index >= height) return `x${index-height+1}`
	if (index === 0) return ''
	return `u${index}`
})
// endregion

// region transform
const simplex = {
	tableau: input,
	indices: Array(input.length).fill(0).map((_, index) => index),
	pivot: {
		column: -1,
		row: -1
	}
}
// endregion

// region calculate next tableau
const iterate = ({ tableau, indices }) => {
	const height = tableau.length
	const width = tableau[0].length
	const pivot = { column: null, row: null }
	const result = { tableau: null, indices: null }

	// select pivot column
	let min = Number.MAX_VALUE
	for (let x = 1; x < width; x++) {
		const item = tableau[0][x]
		if (item < min) {
			pivot.column = x
			min = item
		}
	}

	// calc all possible rows
	const rowTableau = tableau.map((row, y) => {
		if (y === 0) return false
		if (row[pivot.column] <= 0) return false
		return row.map((item, x) => {
			if (x === pivot.column) return math.divide(1, tableau[y][pivot.column])
			return math.divide(item, tableau[y][pivot.column])
		})
	})

	// select pivot row
	pivot.row = (() => {
		const possible = Array(height).fill(true)
		rowTableau.forEach((item, index) => {
			if (item === false) possible[index] = false
		})
		for (let x = 0; x < width; x++) {
			let min = Number.MAX_VALUE
			let withMin = []
			for (let y = 0; y < height; y++) {
				if (!possible[y]) continue
				const item = rowTableau[y][x]
				if (item < min) {
					min = item
					withMin.forEach(index => (possible[index] = false))
					withMin = [y]
				} else if (item === min) {
					withMin.push(y)
				} else {
					possible[y] = false
				}
			}
			if (withMin.length === 1) return withMin[0]
		}
	})()
	
	// no solution?
	if (pivot.row === undefined) {
		console.log('#################')
		console.info('NO SOLUTION FOUND')
		console.log('#################')
		process.exit(0)
	}

	// log pivot element
	pivot.value = tableau[pivot.row][pivot.column]

	// clone tableau
	const notSwapped = matrixClone(tableau).map((row, yIndex) =>
		row.map((item, xIndex) => {
			if (
				xIndex === pivot.column &&
				yIndex === pivot.row // pivot element
			)
				return math.divide(1, item)
			if (
				xIndex === pivot.column // pivot column
			)
				return math.divide(math.multiply(-1, item), pivot.value)
			if (
				yIndex === pivot.row // pivot row
			)
				return math.divide(item, pivot.value)
			return math.subtract(
				item,
				math.divide(
					math.multiply(
						tableau[yIndex][pivot.column],
						tableau[pivot.row][xIndex]
					),
					pivot.value
				)
			)
		})
	)

	// fill
	result.tableau = matrixClone(notSwapped)
	for (let y = 0; y < height; y++) {
		result.tableau[y][pivot.column] = 0
	}
	result.tableau[pivot.row][pivot.column] = 1

	// finish
	result.indices = vectorClone(indices)
	result.indices[pivot.row] = pivot.column
	result.pivot = pivot
	return result
}
// endregion

// region run
while (NaN !== NaN) {
	// should stop?
	let shouldStop = true
	for (let x = 1; x < simplex.tableau[0].length; x++) {
		if (simplex.tableau[0][x] < 0) shouldStop = false
	}
	if (shouldStop) {
		print({
			tableau: simplex.tableau,
			indices: simplex.indices,
			pivot: {
				column: -1,
				row: -1
			}
		})
		break
	}

	const { indices, tableau, pivot } = iterate(simplex)
	print({
		tableau: simplex.tableau,
		indices: simplex.indices,
		pivot
	})
	simplex.indices = indices
	simplex.tableau = tableau
	simplex.pivot = pivot
}
// endregion

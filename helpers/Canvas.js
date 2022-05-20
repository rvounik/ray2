export default class Canvas {

    /**
     * Clears the entire canvas by drawing a rectangle with the provided color (defaults to black)
     */
    static clearCanvas(context, color = '#000000') {
        context.fillStyle = color;
        context.fillRect(0, 0, 800, 600);
    }
}

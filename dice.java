/*
 * Simulare il lancio di 2 dado
 * per n max 150 volte
 * Stampare  le frequenze di ogni facccia
 * e un istogramma con asterischi
 */
public class Main {

    public static void main(String[] args) {

        int n, i, dado, dado2;
        int[] frequencyD1 = new int[7];
        int[] frequencyD2 = new int[7];


        n = (int) (Math.random() * 141 + 10);

        for (i = 1; i <= n; i++) {
            dado = (int) (Math.random() * 6 + 1);
            dado2 = (int) (Math.random() * 6 + 1);


            switch (dado) {
                case 1: frequencyD1[1]++; break;
                case 2: frequencyD1[2]++; break;
                case 3: frequencyD1[3]++; break;
                case 4: frequencyD1[4]++; break;
                case 5: frequencyD1[5]++; break;
                case 6: frequencyD1[6]++; break;
            }// Ends 1st Switch Case

            switch (dado2) {
                case 1: frequencyD2[1]++; break;
                case 2: frequencyD2[2]++; break;
                case 3: frequencyD2[3]++; break;
                case 4: frequencyD2[4]++; break;
                case 5: frequencyD2[5]++; break;
                case 6: frequencyD2[6]++; break;
            }// Ends 2nd Switch Case

        } //Ends FOR  LOOP


        System.out.println("Stampa Frequenze Lancia Dado");
        System.out.println("Numero Lanci: " + n);

        int loop = 1;
        while (loop < 7) {

            System.out.println(loop + " => " + frequencyD1[loop]);
            for (int asterik=0; asterik<frequencyD1[loop];asterik++){
                System.out.print(" * ");
            }
            System.out.println("\n");
            loop++;

        } // Ends Second While Loop



        System.out.println("Stampa Frequenze Lancia Dado 2");
        System.out.println("Numero Lanci: " + n);
        int loop2 = 1;
        while (loop2 < 7) {

            System.out.println(loop + " => " + frequencyD2[loop2]);
            for (int asterikD2=0; asterikD2<frequencyD2[loop2];asterikD2++){
                System.out.print(" * ");
            }
            System.out.println("\n");
            loop2++;

        } // Ends Second While Loop



    } // Ends Main method

}//Ends MAIN Class
